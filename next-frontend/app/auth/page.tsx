"use client"

import { useEffect, useState } from 'react'
import { GraduationCap, Lock, User, RefreshCw, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  // Captcha state
  const [captchaId, setCaptchaId] = useState<string>('')
  const [captchaText, setCaptchaText] = useState<string>('')
  const [captchaImg, setCaptchaImg] = useState<string>('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  const loadCaptcha = async () => {
    setCaptchaLoading(true)
    try {
      const res = await fetch('/api/auth/captcha', { cache: 'no-store' })
      const data = await res.json()
      setCaptchaId(data?.captchaId || '')
      setCaptchaImg(data?.imageBase64 || '')
      setCaptchaText('')
    } catch {
      // ignore
    } finally {
      setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'login') loadCaptcha()
  }, [mode])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, captchaId, captchaText }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.message || '登录失败'))
        setMessage({ text: '登录成功！正在跳转…', type: 'success' })
        const redirectUrl = data.role === 'Student' ? '/profile' : '/dashboard'
        setTimeout(() => { window.location.href = redirectUrl }, 800)
      } else {
        const payload = { username, passwordHash: password, role: 'Student' }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.text()
        if (!res.ok) throw new Error(data || '注册失败')
        setMessage({ text: '账户创建成功！请登录。', type: 'success' })
        setTimeout(() => {
          setMode('login')
          setPassword('')
          loadCaptcha()
        }, 1500)
      }
    } catch (e: any) {
      setMessage({ text: e?.message || '发生错误', type: 'error' })
      if (mode === 'login') loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? '欢迎回来' : '创建账户'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {mode === 'login' 
              ? '登录以访问您的宿舍管理门户' 
              : '注册学生账户以开始使用'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-soft dark:border-gray-700 dark:bg-gray-800">
          {/* Mode Tabs */}
          <div className="tabs mb-6">
            <button
              onClick={() => setMode('login')}
              className={mode === 'login' ? 'tab-active' : 'tab hover:bg-gray-50 dark:hover:bg-gray-700'}
            >
              <LogIn className="mr-2 inline h-4 w-4" />
              登录
            </button>
            <button
              onClick={() => setMode('signup')}
              className={mode === 'signup' ? 'tab-active' : 'tab hover:bg-gray-50 dark:hover:bg-gray-700'}
            >
              <UserPlus className="mr-2 inline h-4 w-4" />
              注册
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="input-label">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="input-label">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Captcha (Login only) */}
            {mode === 'login' && (
              <div>
                <label className="input-label">验证码</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {captchaLoading ? (
                      <div className="flex h-12 w-28 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    ) : captchaImg ? (
                      <img 
                        src={captchaImg} 
                        alt="验证码" 
                        className="h-12 rounded-lg border border-gray-200 dark:border-gray-600" 
                      />
                    ) : (
                      <div className="flex h-12 w-28 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-500 dark:bg-gray-700">
                        加载中...
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={captchaLoading}
                    className="btn-ghost rounded-lg p-2"
                    title="刷新验证码"
                  >
                    <RefreshCw className={`h-5 w-5 ${captchaLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="请输入验证码"
                    value={captchaText}
                    onChange={(e) => setCaptchaText(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Role Info (Signup only) */}
            {mode === 'signup' && (
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">学生账户</p>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                      您将以学生身份注册。登录后请完善个人资料以申请房间。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`rounded-lg p-4 text-sm ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  请稍候…
                </>
              ) : (
                <>
                  {mode === 'login' ? '登录' : '创建账户'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {mode === 'login' ? '还没有账户？' : '已有账户？'}
              </span>
            </div>
          </div>

          {/* Switch Mode */}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="btn-secondary w-full"
          >
            {mode === 'login' ? '创建学生账户' : '返回登录'}
          </button>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            演示账户
          </p>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">管理员</p>
              <p className="text-gray-500 dark:text-gray-400">admin / admin123</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">宿管</p>
              <p className="text-gray-500 dark:text-gray-400">manager / manager123</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">学生</p>
              <p className="text-gray-500 dark:text-gray-400">student / student123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
