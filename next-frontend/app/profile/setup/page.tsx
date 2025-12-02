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

      setMessage({ type: 'success', text: 'Profile saved successfully!' })
      setHasProfile(true)
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="container-section">
        <p>Loading...</p>
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
              {hasProfile ? 'Edit Your Profile' : 'Create Your Profile'}
            </h2>
            <p className="text-sm text-gray-500">
              {hasProfile 
                ? 'Update your personal information below' 
                : 'Fill in your details to complete your student registration'}
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
              <label className="mb-1 block text-sm font-medium">Student ID *</label>
              <input
                required
                disabled={hasProfile} // Can't change student ID after creation
                placeholder="e.g., 20250001"
                className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:disabled:bg-gray-800"
                value={form.studentID}
                onChange={(e) => setForm({ ...form, studentID: e.target.value })}
              />
              {hasProfile && (
                <p className="mt-1 text-xs text-gray-500">Student ID cannot be changed</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Full Name *</label>
              <input
                required
                placeholder="Enter your full name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Gender *</label>
              <select
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Major *</label>
              <input
                required
                placeholder="e.g., Computer Science"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Class</label>
              <input
                placeholder="e.g., CS-2025-A"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.studentClass}
                onChange={(e) => setForm({ ...form, studentClass: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Enrollment Year *</label>
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
              <label className="mb-1 block text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g., 1234567890"
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                placeholder="e.g., student@example.com"
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
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            
            {hasProfile && (
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {!hasProfile && (
          <p className="mt-4 text-center text-sm text-gray-500">
            After creating your profile, you can apply for a room.
          </p>
        )}
      </div>
    </section>
  )
}
