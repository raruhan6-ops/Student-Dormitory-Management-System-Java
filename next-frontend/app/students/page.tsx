"use client"

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, X, Users, Download, RefreshCw, AlertCircle } from 'lucide-react'

type Student = {
  studentID: string
  name: string
  gender: string
  major: string
  studentClass: string
  phone: string
  enrollmentYear: number
  dormBuilding?: string
  roomNumber?: string
  bedNumber?: string
}

const emptyStudent: Omit<Student, 'studentID'> & { studentID: string } = {
  studentID: '',
  name: '',
  gender: 'M',
  major: '',
  studentClass: '',
  phone: '',
  enrollmentYear: new Date().getFullYear(),
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<Student>(emptyStudent as Student)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/students')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      students.filter(
        (s) =>
          s.studentID?.toLowerCase().includes(q) ||
          s.name?.toLowerCase().includes(q) ||
          s.major?.toLowerCase().includes(q) ||
          s.studentClass?.toLowerCase().includes(q)
      )
    )
  }, [search, students])

  const openAdd = () => {
    setForm(emptyStudent as Student)
    setEditMode(false)
    setModalOpen(true)
  }

  const openEdit = (s: Student) => {
    setForm({ ...s })
    setEditMode(true)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'enrollmentYear' ? Number(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editMode ? `/api/students/${form.studentID}` : '/api/students'
      const method = editMode ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      closeModal()
      load()
    } catch (e: any) {
      alert(e?.message || 'Error saving student')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个学生吗？')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      load()
    } catch (e: any) {
      alert(e?.message || '删除出错')
    }
  }

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载学生数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">加载学生数据失败</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{error}</p>
          <button onClick={load} className="btn-primary mt-4">
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-section">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Users className="h-5 w-5" />
            </div>
            学生管理
          </h1>
          <p className="page-description mt-1">
            管理学生档案和信息
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" />
            添加学生
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索学号、姓名、专业或班级..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="badge-info">
            共 {students.length} 人，显示 {filtered.length} 人
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">学号</th>
              <th className="table-header-cell">姓名</th>
              <th className="table-header-cell">性别</th>
              <th className="table-header-cell">专业</th>
              <th className="table-header-cell">班级</th>
              <th className="table-header-cell">电话</th>
              <th className="table-header-cell">入学年份</th>
              <th className="table-header-cell">宿舍</th>
              <th className="table-header-cell text-right">操作</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filtered.map((s) => (
              <tr key={s.studentID} className="table-row">
                <td className="table-cell font-medium text-gray-900 dark:text-white">{s.studentID}</td>
                <td className="table-cell">{s.name}</td>
                <td className="table-cell">
                  <span className={`badge ${s.gender === 'M' || s.gender === 'Male' ? 'badge-primary' : 'badge-info'}`}>
                    {s.gender === 'M' || s.gender === 'Male' ? '男' : s.gender === 'F' || s.gender === 'Female' ? '女' : s.gender}
                  </span>
                </td>
                <td className="table-cell">{s.major}</td>
                <td className="table-cell">{s.studentClass}</td>
                <td className="table-cell">{s.phone || '-'}</td>
                <td className="table-cell">{s.enrollmentYear}</td>
                <td className="table-cell">
                  {s.dormBuilding && s.roomNumber ? (
                    <span className="badge-success">
                      {s.dormBuilding} - {s.roomNumber}室
                    </span>
                  ) : (
                    <span className="badge-warning">未分配</span>
                  )}
                </td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => openEdit(s)} 
                      className="btn-ghost rounded-lg p-2"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.studentID)} 
                      className="btn-ghost rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="empty-state">
                    <Users className="empty-state-icon" />
                    <p className="empty-state-title">未找到学生</p>
                    <p className="empty-state-description">
                      {search ? '请尝试其他搜索条件' : '添加第一个学生以开始使用'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editMode ? '编辑学生' : '添加新学生'}</h3>
              <button onClick={closeModal} className="btn-ghost rounded-lg p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="input-label">学号</label>
                  <input
                    name="studentID"
                    value={form.studentID}
                    onChange={handleChange}
                    disabled={editMode}
                    className="input disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">姓名</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">性别</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="M">男</option>
                    <option value="F">女</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">专业</label>
                  <input
                    name="major"
                    value={form.major}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="input-label">班级</label>
                  <input
                    name="studentClass"
                    value={form.studentClass}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="input-label">电话</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="input-label">入学年份</label>
                  <input
                    name="enrollmentYear"
                    type="number"
                    value={form.enrollmentYear}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  取消
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
