"use client"

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

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

  const handleSubmit = async () => {
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
    if (!confirm('Delete this student?')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      load()
    } catch (e: any) {
      alert(e?.message || 'Error deleting')
    }
  }

  return (
    <section className="container-section">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Students</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search by ID, name, major, class…"
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 dark:border-gray-700 dark:bg-gray-900"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-semibold">ID</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Name</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Gender</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Major</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Class</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Phone</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Year</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((s) => (
                <tr key={s.studentID}>
                  <td className="px-3 py-2 text-sm">{s.studentID}</td>
                  <td className="px-3 py-2 text-sm">{s.name}</td>
                  <td className="px-3 py-2 text-sm">{s.gender === 'M' ? 'Male' : s.gender === 'F' ? 'Female' : s.gender}</td>
                  <td className="px-3 py-2 text-sm">{s.major}</td>
                  <td className="px-3 py-2 text-sm">{s.studentClass}</td>
                  <td className="px-3 py-2 text-sm">{s.phone}</td>
                  <td className="px-3 py-2 text-sm">{s.enrollmentYear}</td>
                  <td className="flex gap-2 px-3 py-2 text-sm">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(s.studentID)} className="text-red-600 hover:underline" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editMode ? 'Edit Student' : 'Add Student'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">Student ID</label>
                <input
                  name="studentID"
                  value={form.studentID}
                  onChange={handleChange}
                  disabled={editMode}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Major</label>
                <input
                  name="major"
                  value={form.major}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Class</label>
                <input
                  name="studentClass"
                  value={form.studentClass}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Enrollment Year</label>
                <input
                  name="enrollmentYear"
                  type="number"
                  value={form.enrollmentYear}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
