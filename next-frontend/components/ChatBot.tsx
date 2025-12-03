"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  MessageCircle, X, Send, Bot, User, Minimize2, Loader2, 
  Trash2, RotateCcw, Sparkles, Home, Wrench, FileText, 
  BedDouble, HelpCircle, Clock, CheckCircle, Copy, Check,
  ChevronDown, Settings, Volume2, VolumeX, Maximize2
} from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

type QuickAction = {
  icon: React.ReactNode
  label: string
  prompt: string
}

const STORAGE_KEY = 'dormitory_chat_history'
const MAX_HISTORY = 50

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Quick action suggestions
  const quickActions: QuickAction[] = [
    { icon: <BedDouble className="h-4 w-4" />, label: '申请房间', prompt: '如何申请宿舍房间？' },
    { icon: <Home className="h-4 w-4" />, label: '入住流程', prompt: '入住宿舍的流程是什么？' },
    { icon: <Wrench className="h-4 w-4" />, label: '报修服务', prompt: '如何提交报修请求？' },
    { icon: <FileText className="h-4 w-4" />, label: '查看信息', prompt: '如何查看我的住宿信息？' },
    { icon: <HelpCircle className="h-4 w-4" />, label: '使用帮助', prompt: '系统有哪些主要功能？' },
  ]

  // Generate unique ID
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }
    
    // Add welcome message if no history
    if (!saved || JSON.parse(saved).length === 0) {
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: '👋 你好！我是**小宿**，你的智能宿舍助手。\n\n我可以帮助你：\n- 🏠 了解房间申请流程\n- 🛏️ 查询入住/退房信息\n- 🔧 提交和跟踪报修请求\n- 📋 解答系统使用问题\n\n请问有什么可以帮助你的？',
        timestamp: new Date(),
        status: 'sent'
      }])
    }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.slice(-MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    }
  }, [messages])

  // Update unread count when minimized
  useEffect(() => {
    if (!isMinimized && !isOpen) {
      setUnreadCount(0)
    }
  }, [isMinimized, isOpen])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+cnZmWkIqFf3x8fH2AhIaKjI+QkZKTk5SUlJSTk5OSkpGRkJCPj46Ojo2NjY2MjIyLi4uKioqJiYmIiIiHh4eGhoaFhYWEhISEg4ODg4KCgoKBgYGBgICA')
      audio.volume = 0.3
      audio.play().catch(() => {})
    }
  }, [soundEnabled])

  // Copy message to clipboard
  const copyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  // Clear chat history
  const clearHistory = () => {
    if (confirm('确定要清除所有聊天记录吗？')) {
      localStorage.removeItem(STORAGE_KEY)
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: '聊天记录已清除。有什么可以帮助你的吗？',
        timestamp: new Date(),
        status: 'sent'
      }])
      setShowQuickActions(true)
    }
  }

  // Regenerate last response
  const regenerateResponse = async () => {
    const lastUserMsgIndex = messages.map(m => m.role).lastIndexOf('user')
    if (lastUserMsgIndex === -1) return
    
    const userMessage = messages[lastUserMsgIndex]
    const previousMessages = messages.slice(0, lastUserMsgIndex)
    
    setMessages(previousMessages)
    setInput(userMessage.content)
    
    // Trigger send after state update
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      inputRef.current?.dispatchEvent(event)
    }, 100)
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // Render markdown-like content
  const renderContent = (content: string) => {
    // Simple markdown parsing
    const parts = content.split(/(\*\*.*?\*\*|\n|`.*?`)/g)
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">{part.slice(1, -1)}</code>
      }
      if (part === '\n') {
        return <br key={i} />
      }
      return part
    })
  }

  const sendMessage = async (customMessage?: string) => {
    const messageContent = customMessage || input.trim()
    if (!messageContent || isLoading) return

    setShowQuickActions(false)
    const userMessage: Message = { 
      id: generateId(),
      role: 'user', 
      content: messageContent,
      timestamp: new Date(),
      status: 'sending'
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      // Update user message status
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id ? { ...m, status: 'sent' } : m
      ))

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应')

      const decoder = new TextDecoder()
      let assistantMessage = ''
      const assistantId = generateId()

      setMessages(prev => [...prev, { 
        id: assistantId,
        role: 'assistant', 
        content: '',
        timestamp: new Date(),
        status: 'sending'
      }])

      setIsTyping(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        const cleanedMessage = assistantMessage
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/<think>[\s\S]*/g, '')
          .trim()

        setMessages(prev => {
          const newMessages = [...prev]
          const lastIdx = newMessages.findIndex(m => m.id === assistantId)
          if (lastIdx !== -1) {
            newMessages[lastIdx] = {
              ...newMessages[lastIdx],
              content: cleanedMessage,
              status: 'sent'
            }
          }
          return newMessages
        })
      }

      // Play sound and update unread
      playSound()
      if (isMinimized) {
        setUnreadCount(prev => prev + 1)
      }

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => {
        const updated = prev.map(m => 
          m.id === userMessage.id ? { ...m, status: 'error' as const } : m
        )
        return [...updated, {
          id: generateId(),
          role: 'assistant' as const,
          content: `❌ ${error instanceof Error ? error.message : '抱歉，发生了错误，请稍后再试。'}`,
          timestamp: new Date(),
          status: 'error' as const
        }]
      })
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false)
      setUnreadCount(0)
    } else {
      setIsOpen(!isOpen)
      if (!isOpen) setUnreadCount(0)
    }
  }

  const minimizeChat = () => {
    setIsMinimized(true)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // Chat window dimensions
  const chatWidth = isExpanded ? 'w-[500px]' : 'w-[380px]'
  const chatHeight = isExpanded ? 'h-[600px]' : 'h-[500px]'

  return (
    <>
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div 
          className={`fixed bottom-24 left-6 z-50 flex ${chatHeight} ${chatWidth} flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-800`}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 via-primary-600 to-emerald-600 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-primary-600 bg-emerald-400"></span>
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 font-semibold text-white">
                  小宿
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                </h3>
                <p className="text-xs text-primary-100">
                  {isTyping ? (
                    <span className="flex items-center gap-1">
                      <span className="flex gap-0.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" style={{ animationDelay: '300ms' }}></span>
                      </span>
                      正在输入
                    </span>
                  ) : (
                    '智能助手在线'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title={soundEnabled ? '关闭提示音' : '开启提示音'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={clearHistory}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title="清除历史"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={toggleExpand}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title={isExpanded ? '缩小' : '放大'}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={minimizeChat}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title="最小化"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={closeChat}
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`group max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                          : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content ? (
                          renderContent(message.content)
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-gray-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            思考中...
                          </span>
                        )}
                      </div>
                      
                      {/* Copy button */}
                      {message.content && message.role === 'assistant' && (
                        <button
                          onClick={() => copyMessage(message.id, message.content)}
                          className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 opacity-0 shadow-md transition-opacity group-hover:opacity-100 dark:bg-gray-700"
                          title="复制"
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Timestamp and status */}
                    <div className={`mt-1 flex items-center gap-1.5 text-xs text-gray-400 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      <Clock className="h-3 w-3" />
                      {formatTime(message.timestamp)}
                      {message.role === 'user' && message.status === 'sent' && (
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      )}
                      {message.status === 'error' && (
                        <span className="text-red-500">发送失败</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-800">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          {showQuickActions && messages.length <= 2 && (
            <div className="border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">快捷问题</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-primary-500 dark:hover:bg-primary-900/30"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            {/* Regenerate button */}
            {messages.length > 2 && !isLoading && (
              <button
                onClick={regenerateResponse}
                className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <RotateCcw className="h-3 w-3" />
                重新生成回复
              </button>
            )}
            
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题... (Shift+Enter换行)"
                disabled={isLoading}
                rows={1}
                className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:bg-white disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-500 dark:focus:bg-gray-600"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transition-all hover:from-primary-600 hover:to-primary-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                title="发送"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
              按 Enter 发送 · Shift+Enter 换行 · 由 AI 驱动
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full shadow-lg transition-all duration-300 ${
          isOpen && !isMinimized
            ? 'h-12 w-12 bg-gray-600 hover:bg-gray-700'
            : 'bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-500 px-4 py-3 hover:shadow-xl'
        }`}
        title={isOpen ? (isMinimized ? '展开聊天' : '关闭聊天') : '打开智能助手'}
      >
        {isOpen && !isMinimized ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <>
            <div className="relative">
              <MessageCircle className="h-5 w-5 text-white" />
              {!isOpen && (
                <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-yellow-300" />
              )}
            </div>
            {!isOpen && (
              <span className="font-medium text-white">AI 助手</span>
            )}
            {isMinimized && (
              <span className="font-medium text-white">小宿</span>
            )}
          </>
        )}
        
        {/* Unread badge */}
        {(isMinimized || !isOpen) && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Notification pulse */}
        {isMinimized && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </span>
        )}
      </button>
    </>
  )
}
