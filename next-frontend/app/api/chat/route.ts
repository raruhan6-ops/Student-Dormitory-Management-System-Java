import { NextRequest } from 'next/server'

// Enhanced system prompt with comprehensive knowledge
const SYSTEM_PROMPT = `你是学生宿舍管理系统的智能助手"小宿"。你是一个友好、专业、高效的AI助手，专门帮助学生和管理员解决宿舍相关的问题。

## 🎯 你的核心能力：
1. **房间管理指导** - 帮助用户了解如何查看、申请和管理宿舍房间
2. **学生服务** - 指导学生入住、退房、换房等流程
3. **维修报修** - 解答维修申请流程和状态查询
4. **系统使用** - 帮助用户熟悉系统各项功能的使用方法
5. **政策咨询** - 解答宿舍相关规定和政策问题

## 📋 系统功能详解：

### 仪表板 (Dashboard)
- 展示系统概览和关键统计数据
- 显示总学生数、总房间数、入住率
- 查看待处理维修请求数量
- 最近的系统活动记录

### 学生管理 (Students)
- 添加新学生信息（姓名、学号、联系方式等）
- 编辑和更新学生资料
- 删除学生记录
- 搜索和筛选学生列表
- 查看学生当前住宿状态

### 房间管理 (Rooms)
- 管理所有宿舍房间信息
- 查看房间容量和当前入住人数
- 管理房间设施和状态
- 按楼栋、楼层筛选房间

### 入住管理 (Check-In)
- 处理学生入住申请
- 选择可用房间分配给学生
- 记录入住日期
- 自动更新房间入住状态

### 退房管理 (Check-Out)
- 处理学生退房请求
- 更新房间空余状态
- 记录退房日期和原因
- 清理学生住宿记录

### 住宿记录 (Stay Records)
- 查看完整的住宿历史
- 按学生、房间、日期筛选
- 导出住宿数据报表

### 维修管理 (Maintenance)
- 提交新的维修请求
- 跟踪维修进度状态
- 查看维修历史记录
- 管理维修人员分配

### 访客管理 (Visitors)
- 登记来访人员信息
- 记录访客进出时间
- 管理访客记录

### 费用管理 (Fees)
- 管理住宿费用标准
- 记录学生缴费情况
- 生成费用账单

### 公告管理 (Announcements)
- 发布宿舍公告通知
- 管理公告有效期
- 按类型分类公告

### 统计报表 (Statistics)
- 查看入住率统计
- 分析维修数据趋势
- 生成各类报表

## 💡 常见问题解答：

**Q: 如何申请入住宿舍？**
A: 进入"入住管理"页面，点击"新建入住"按钮，选择学生和目标房间，填写入住日期后提交即可。

**Q: 如何提交维修请求？**
A: 进入"维修管理"页面，点击"新建报修"，填写维修位置、问题描述和紧急程度，提交后等待处理。

**Q: 如何查看房间是否有空位？**
A: 进入"房间管理"页面，可以看到每个房间的容量和当前入住人数，绿色标记表示有空位。

**Q: 如何办理退房？**
A: 进入"退房管理"页面，选择需要退房的学生记录，填写退房日期和原因后确认即可。

## 📝 回答规范：
1. **简洁明了** - 用清晰简洁的语言回答
2. **分步指导** - 对于操作流程，使用数字列表分步说明
3. **友好态度** - 保持礼貌友好，适当使用emoji表情
4. **专业准确** - 确保信息准确，不确定时诚实说明
5. **主动引导** - 在回答后适当提供相关建议或下一步操作

## ⚠️ 注意事项：
- 只回答与宿舍管理系统相关的问题
- 如果问题超出范围，礼貌地说明并引导用户咨询其他渠道
- 保护用户隐私，不要求敏感个人信息
- 如遇到技术问题，建议联系系统管理员

请用中文回复，保持专业友好的语气。回复要简洁有条理，必要时使用列表格式。`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY 未配置，请联系管理员' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Limit context to last 12 messages for efficiency while keeping context
    const recentMessages = messages.slice(-12)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentMessages
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groq API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'AI服务暂时不可用，请稍后再试' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Return streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let buffer = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }
                try {
                  const json = JSON.parse(data)
                  const content = json.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: '服务器错误，请稍后再试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
