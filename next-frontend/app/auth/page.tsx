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
        if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.message || 'Login failed'))
        setMessage({ text: 'Login successful! Redirecting…', type: 'success' })
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
        if (!res.ok) throw new Error(data || 'Registration failed')
        setMessage({ text: 'Account created successfully! Please sign in.', type: 'success' })
        setTimeout(() => {
          setMode('login')
          setPassword('')
          loadCaptcha()
        }, 1500)
      }
    } catch (e: any) {
      setMessage({ text: e?.message || 'Something went wrong', type: 'error' })
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
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {mode === 'login' 
              ? 'Sign in to access your dormitory portal' 
              : 'Register as a student to get started'}
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
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={mode === 'signup' ? 'tab-active' : 'tab hover:bg-gray-50 dark:hover:bg-gray-700'}
            >
              <UserPlus className="mr-2 inline h-4 w-4" />
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="input-label">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
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
                <label className="input-label">Security Code</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {captchaLoading ? (
                      <div className="flex h-12 w-28 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    ) : captchaImg ? (
                      <img 
                        src={captchaImg} 
                        alt="captcha" 
                        className="h-12 rounded-lg border border-gray-200 dark:border-gray-600" 
                      />
                    ) : (
                      <div className="flex h-12 w-28 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-500 dark:bg-gray-700">
                        Loading...
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={captchaLoading}
                    className="btn-ghost rounded-lg p-2"
                    title="Refresh captcha"
                  >
                    <RefreshCw className={`h-5 w-5 ${captchaLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Enter code"
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
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Student Account</p>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                      You'll be registered as a student. Complete your profile after signing in to apply for a room.
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
                  Please wait…
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
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
                {mode === 'login' ? 'New to UniDorm?' : 'Already have an account?'}
              </span>
            </div>
          </div>

          {/* Switch Mode */}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="btn-secondary w-full"
          >
            {mode === 'login' ? 'Create a Student Account' : 'Sign In Instead'}
          </button>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Demo Credentials
          </p>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">Admin</p>
              <p className="text-gray-500 dark:text-gray-400">admin / admin123</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">Manager</p>
              <p className="text-gray-500 dark:text-gray-400">manager / manager123</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">Student</p>
              <p className="text-gray-500 dark:text-gray-400">student / student123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
