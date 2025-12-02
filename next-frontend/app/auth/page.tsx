"use client"

import { useEffect, useState } from 'react'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Student')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Captcha state
  const [captchaId, setCaptchaId] = useState<string>('')
  const [captchaText, setCaptchaText] = useState<string>('')
  const [captchaImg, setCaptchaImg] = useState<string>('')

  const loadCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha', { cache: 'no-store' })
      const data = await res.json()
      setCaptchaId(data?.captchaId || '')
      setCaptchaImg(data?.imageBase64 || '')
      setCaptchaText('')
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (mode === 'login') loadCaptcha()
  }, [mode])

  const submit = async () => {
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
        // Cookie is set by backend (HttpOnly). Redirect.
        setMessage('Login successful, redirecting…')
        setTimeout(() => { window.location.href = '/dashboard' }, 600)
      } else {
        // Backend expects password in passwordHash
        const payload = { username, passwordHash: password, role }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.text()
        if (!res.ok) throw new Error(data || 'Register failed')
        setMessage('Signup successful')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Something went wrong')
      if (mode === 'login') loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container-section">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode('login')}
            className={`rounded-md px-4 py-2 text-sm ${mode === 'login' ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-700'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`rounded-md px-4 py-2 text-sm ${mode === 'signup' ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-700'}`}
          >
            Signup
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Username</label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === 'login' && (
            <div>
              <label className="mb-1 block text-sm">Captcha</label>
              <div className="flex items-center gap-3">
                {captchaImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={captchaImg} alt="captcha" className="h-10 rounded border border-gray-300 dark:border-gray-700" />
                ) : (
                  <div className="h-10 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                )}
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-700"
                  onClick={loadCaptcha}
                >
                  Refresh
                </button>
              </div>
              <input
                placeholder="Enter captcha"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={captchaText}
                onChange={(e) => setCaptchaText(e.target.value)}
              />
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm">Role</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Student">Student</option>
                <option value="DormManager">DormManager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
          {message && <p className="text-sm text-center text-gray-600 dark:text-gray-300">{message}</p>}
        </div>
      </div>
    </section>
  )
}
