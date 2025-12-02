"use client"

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Key, X } from 'lucide-react'

type User = {
  userID: number
  username: string
  role: string
  relatedStudentID?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ username: '', passwordHash: '', role: 'Student', relatedStudentID: '' })
  const [saving, setSaving] = useState(false)

  // Reset password modal
  const [resetModal, setResetModal] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/users')
      setUsers(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setSaving(true)
    try {
      const payload = {
        username: form.username,
        passwordHash: form.passwordHash, // Backend hashes this
        role: form.role,
        relatedStudentID: form.relatedStudentID || null,
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      setModalOpen(false)
      setForm({ username: '', passwordHash: '', role: 'Student', relatedStudentID: '' })
      load()
    } catch (e: any) {
      alert(e?.message || '创建用户出错')
    }
    setSaving(false)
  }

  const handleResetPassword = async () => {
    if (!resetModal || !newPassword) return
    try {
      const res = await fetch('/api/auth/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resetModal.username, newPassword }),
      })
      if (!res.ok) throw new Error(await res.text())
      alert('密码重置成功')
      setResetModal(null)
      setNewPassword('')
    } catch (e: any) {
      alert(e?.message || '重置密码出错')
    }
  }

  const roleColor = (role: string) => {
    if (role === 'Admin') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    if (role === 'DormManager') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }

  const roleLabel = (role: string) => {
    if (role === 'Admin') return '管理员'
    if (role === 'DormManager') return '宿舍管理员'
    return '学生'
  }

  return (
    <section className="container-section">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">用户管理</h2>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus size={16} /> 添加用户
        </button>
      </div>

      {loading && <p>加载中…</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">用户名</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">角色</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">关联学号</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {users.map((u) => (
              <tr key={u.userID}>
                <td className="px-4 py-2 text-sm">{u.userID}</td>
                <td className="px-4 py-2 text-sm">{u.username}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`rounded px-2 py-0.5 text-xs ${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
                </td>
                <td className="px-4 py-2 text-sm">{u.relatedStudentID || '-'}</td>
                <td className="px-4 py-2 text-sm">
                  <button onClick={() => setResetModal(u)} className="text-blue-600 hover:underline" title="重置密码">
                    <Key size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">未找到用户。</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">添加用户</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="用户名" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <input placeholder="密码" type="password" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.passwordHash} onChange={(e) => setForm({ ...form, passwordHash: e.target.value })} />
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="Student">学生</option>
                <option value="DormManager">宿舍管理员</option>
                <option value="Admin">管理员</option>
              </select>
              <input placeholder="关联学号（可选）" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.relatedStudentID} onChange={(e) => setForm({ ...form, relatedStudentID: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">取消</button>
              <button onClick={handleCreate} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{saving ? '创建中…' : '创建'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">重置 {resetModal.username} 的密码</h3>
              <button onClick={() => setResetModal(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <input placeholder="新密码" type="password" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setResetModal(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">取消</button>
              <button onClick={handleResetPassword} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">重置</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
