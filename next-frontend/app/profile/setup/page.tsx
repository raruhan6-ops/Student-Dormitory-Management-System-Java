"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Save } from 'lucide-react'

type ProfileForm = {
  studentID: string
  name: string
  gender: string
  major: string
  studentClass: string
  enrollmentYear: number
  phone: string
  email: string
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  
  const currentYear = new Date().getFullYear()
  
  const [form, setForm] = useState<ProfileForm>({
    studentID: '',
    name: '',
    gender: 'Male',
    major: '',
    studentClass: '',
    enrollmentYear: currentYear,
    phone: '',
    email: ''
  })

  useEffect(() => {
    // Check if user already has a profile
    const checkProfile = async () => {
      try {
        const res = await fetch('/api/student-portal/profile')
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setHasProfile(true)
            setForm({
              studentID: data.studentID || '',
              name: data.name || '',
              gender: data.gender || 'Male',
              major: data.major || '',
              studentClass: data.studentClass || '',
              enrollmentYear: data.enrollmentYear || currentYear,
              phone: data.phone || '',
              email: data.email || ''
            })
          }
        }
      } catch (e) {
        // ignore
      }
      setLoading(false)
    }
    checkProfile()
  }, [currentYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/student-portal/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error)
      }

      setMessage({ type: 'success', text: '资料保存成功！' })
      setHasProfile(true)
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || '保存资料失败' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="container-section">
        <p>加载中...</p>
      </section>
    )
  }

  return (
    <section className="container-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <User className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold">
              {hasProfile ? '编辑个人资料' : '创建个人资料'}
            </h2>
            <p className="text-sm text-gray-500">
              {hasProfile 
                ? '在下方更新您的个人信息' 
                : '填写您的详细信息以完成学生注册'}
            </p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-3 ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">学号 *</label>
              <input
                required
                disabled={hasProfile} // Can't change student ID after creation
                placeholder="例如：20250001"
                className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:disabled:bg-gray-800"
                value={form.studentID}
                onChange={(e) => setForm({ ...form, studentID: e.target.value })}
              />
              {hasProfile && (
                <p className="mt-1 text-xs text-gray-500">学号创建后无法修改</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">姓名 *</label>
              <input
                required
                placeholder="请输入您的姓名"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">性别 *</label>
              <select
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="Male">男</option>
                <option value="Female">女</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">专业 *</label>
              <input
                required
                placeholder="例如：计算机科学"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">班级</label>
              <input
                placeholder="例如：计科2025-A班"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.studentClass}
                onChange={(e) => setForm({ ...form, studentClass: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">入学年份 *</label>
              <input
                type="number"
                required
                min="2000"
                max={currentYear}
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.enrollmentYear}
                onChange={(e) => setForm({ ...form, enrollmentYear: parseInt(e.target.value) || currentYear })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">电话号码</label>
              <input
                type="tel"
                placeholder="例如：13812345678"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">邮箱</label>
              <input
                type="email"
                placeholder="例如：student@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? '保存中...' : '保存资料'}
            </button>
            
            {hasProfile && (
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                取消
              </button>
            )}
          </div>
        </form>

        {!hasProfile && (
          <p className="mt-4 text-center text-sm text-gray-500">
            创建资料后，您可以申请宿舍房间。
          </p>
        )}
      </div>
    </section>
  )
}
