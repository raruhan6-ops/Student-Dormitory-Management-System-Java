import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY 未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // System prompt for the dormitory management assistant
    const systemPrompt = {
      role: 'system',
      content: `你是学生宿舍管理系统的智能助手"小宿"。你的职责是帮助用户解答关于宿舍管理的各种问题。

你可以帮助用户了解：
- 如何申请房间和床位
- 入住和退房流程
- 如何提交维修报修请求
- 查看个人资料和住宿信息
- 系统的各项功能使用方法

请用友好、专业的语气回答问题，回答要简洁明了。如果用户的问题超出了宿舍管理的范围，可以礼貌地引导用户回到相关话题。

回复请使用中文。`
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: [systemPrompt, ...messages],
        temperature: 0.6,
        max_tokens: 1024,
        top_p: 0.95,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Groq API error:', errorData)
      return new Response(
        JSON.stringify({ error: '聊天服务暂时不可用，请稍后再试' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Return streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

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

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

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
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
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
