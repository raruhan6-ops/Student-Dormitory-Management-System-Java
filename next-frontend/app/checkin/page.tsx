"use client"

import { useEffect, useState } from 'react'
import { Search, UserPlus, LogOut } from 'lucide-react'

type Student = { studentID: string; name: string; dormBuilding?: string; roomNumber?: string; bedNumber?: string }
type Building = { buildingID: number; buildingName: string }
type Room = { roomID: number; roomNumber: string; currentOccupancy: number; capacity: number }
type Bed = { bedID: number; bedNumber: string; status: string; studentName?: string }

export default function CheckInPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [beds, setBeds] = useState<Bed[]>([])

  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [selectedBed, setSelectedBed] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    const [studentsRes, buildingsRes] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/dormitories'),
    ])
    setStudents(await studentsRes.json())
    setBuildings(await buildingsRes.json())
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (selectedBuilding) {
      fetch(`/api/dormitories/${selectedBuilding}/rooms`).then((r) => r.json()).then(setRooms)
      setSelectedRoom(null)
      setBeds([])
    }
  }, [selectedBuilding])

  useEffect(() => {
    if (selectedRoom) {
      fetch(`/api/dormitories/rooms/${selectedRoom}/beds`).then((r) => r.json()).then(setBeds)
      setSelectedBed(null)
    }
  }, [selectedRoom])

  const filteredStudents = students.filter(
    (s) =>
      s.studentID.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  )

  const availableBeds = beds.filter((b) => b.status === 'Available')

  const handleCheckIn = async () => {
    if (!selectedStudent || !selectedBed) return
    setProcessing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/dormitories/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentID: selectedStudent.studentID, bedID: selectedBed }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text)
      setMessage({ type: 'success', text: 'Check-in successful!' })
      setSelectedStudent(null)
      setSelectedBed(null)
      load()
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Check-in failed' })
    }
    setProcessing(false)
  }

  const handleCheckOut = async (studentId: string) => {
    if (!confirm('Check out this student?')) return
    setProcessing(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/dormitories/check-out/${studentId}`, { method: 'POST' })
      const text = await res.text()
      if (!res.ok) throw new Error(text)
      setMessage({ type: 'success', text: 'Check-out successful!' })
      load()
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Check-out failed' })
    }
    setProcessing(false)
  }

  const checkedInStudents = students.filter((s) => s.dormBuilding && s.roomNumber && s.bedNumber)

  return (
    <section className="container-section">
      <h2 className="mb-4 text-2xl font-semibold">Check-In / Check-Out</h2>

      {message && (
        <div className={`mb-4 rounded-md px-4 py-2 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-In Panel */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><UserPlus size={18} /> Check-In</h3>

          {/* Student Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search student by ID or name…"
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 dark:border-gray-700 dark:bg-gray-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search && (
            <div className="mb-3 max-h-40 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
              {filteredStudents.filter((s) => !s.dormBuilding).slice(0, 10).map((s) => (
                <div
                  key={s.studentID}
                  onClick={() => { setSelectedStudent(s); setSearch('') }}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedStudent?.studentID === s.studentID ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                >
                  {s.studentID} - {s.name}
                </div>
              ))}
              {filteredStudents.filter((s) => !s.dormBuilding).length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">No unassigned students found.</p>
              )}
            </div>
          )}

          {selectedStudent && (
            <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm dark:bg-blue-900/20">
              Selected: <strong>{selectedStudent.name}</strong> ({selectedStudent.studentID})
            </div>
          )}

          {/* Building / Room / Bed Selectors */}
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={selectedBuilding ?? ''}
              onChange={(e) => setSelectedBuilding(Number(e.target.value) || null)}
            >
              <option value="">Select Building</option>
              {buildings.map((b) => <option key={b.buildingID} value={b.buildingID}>{b.buildingName}</option>)}
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={selectedRoom ?? ''}
              onChange={(e) => setSelectedRoom(Number(e.target.value) || null)}
              disabled={!selectedBuilding}
            >
              <option value="">Select Room</option>
              {rooms.map((r) => <option key={r.roomID} value={r.roomID}>Room {r.roomNumber} ({r.currentOccupancy}/{r.capacity})</option>)}
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={selectedBed ?? ''}
              onChange={(e) => setSelectedBed(Number(e.target.value) || null)}
              disabled={!selectedRoom}
            >
              <option value="">Select Bed</option>
              {availableBeds.map((b) => <option key={b.bedID} value={b.bedID}>Bed #{b.bedNumber}</option>)}
            </select>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={!selectedStudent || !selectedBed || processing}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? 'Processing…' : 'Assign Bed (Check-In)'}
          </button>
        </div>

        {/* Check-Out Panel */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><LogOut size={18} /> Currently Checked-In</h3>
          <div className="max-h-80 overflow-y-auto">
            {checkedInStudents.length === 0 && <p className="text-sm text-gray-500">No students currently checked in.</p>}
            {checkedInStudents.map((s) => (
              <div key={s.studentID} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.dormBuilding} / Room {s.roomNumber} / Bed {s.bedNumber}</p>
                </div>
                <button
                  onClick={() => handleCheckOut(s.studentID)}
                  disabled={processing}
                  className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
                >
                  Check Out
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
