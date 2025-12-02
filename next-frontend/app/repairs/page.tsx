"use client"

import { useEffect, useState } from 'react'
import { Plus, Wrench, CheckCircle, Clock, X } from 'lucide-react'

type RepairRequest = {
  repairID: number
  roomID: number
  submitterStudentID: string
  description: string
  submitTime: string
  status: string
  handler?: string
  finishTime?: string
}

export default function RepairsPage() {
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'Pending' | 'InProgress' | 'Finished'>('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ roomID: '', submitterStudentID: '', description: '' })
  const [saving, setSaving] = useState(false)

  // Handler modal
  const [handlerModal, setHandlerModal] = useState<RepairRequest | null>(null)
  const [handlerForm, setHandlerForm] = useState({ handler: '', status: 'InProgress' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/repairs')
      setRequests(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, roomID: Number(form.roomID) }),
      })
      if (!res.ok) throw new Error('Failed')
      setModalOpen(false)
      setForm({ roomID: '', submitterStudentID: '', description: '' })
      load()
    } catch {
      alert('Error submitting request')
    }
    setSaving(false)
  }

  const handleUpdateStatus = async () => {
    if (!handlerModal) return
    try {
      const res = await fetch(`/api/repairs/${handlerModal.repairID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handlerForm),
      })
      if (!res.ok) throw new Error('Failed')
      setHandlerModal(null)
      load()
    } catch {
      alert('Error updating')
    }
  }

  const statusIcon = (status: string) => {
    if (status === 'Finished') return <CheckCircle size={16} className="text-green-600" />
    if (status === 'InProgress') return <Clock size={16} className="text-yellow-600" />
    return <Wrench size={16} className="text-gray-500" />
  }

  return (
    <section className="container-section">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Repair Requests</h2>
        <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {(['all', 'Pending', 'InProgress', 'Finished'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 text-sm ${filter === f ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-700'}`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {loading && <p>Loading…</p>}

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.repairID} className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {statusIcon(r.status)}
                <span className="font-medium">Room #{r.roomID}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${r.status === 'Finished' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : r.status === 'InProgress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {r.status}
                </span>
              </div>
              {r.status !== 'Finished' && (
                <button
                  onClick={() => { setHandlerModal(r); setHandlerForm({ handler: r.handler || '', status: r.status === 'Pending' ? 'InProgress' : 'Finished' }) }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Update
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{r.description}</p>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>Submitted: {new Date(r.submitTime).toLocaleString()}</span>
              {r.handler && <span>Handler: {r.handler}</span>}
              {r.finishTime && <span>Finished: {new Date(r.finishTime).toLocaleString()}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-gray-500">No requests found.</p>}
      </div>

      {/* New Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Repair Request</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Room ID" type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.roomID} onChange={(e) => setForm({ ...form, roomID: e.target.value })} />
              <input placeholder="Your Student ID" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.submitterStudentID} onChange={(e) => setForm({ ...form, submitterStudentID: e.target.value })} />
              <textarea placeholder="Describe the issue…" rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Submitting…' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Handler Modal */}
      {handlerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Update Request</h3>
              <button onClick={() => setHandlerModal(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Handler Name" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={handlerForm.handler} onChange={(e) => setHandlerForm({ ...handlerForm, handler: e.target.value })} />
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={handlerForm.status} onChange={(e) => setHandlerForm({ ...handlerForm, status: e.target.value })}>
                <option value="InProgress">In Progress</option>
                <option value="Finished">Finished</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setHandlerModal(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button>
              <button onClick={handleUpdateStatus} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
