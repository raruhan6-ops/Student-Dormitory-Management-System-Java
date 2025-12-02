"use client"

import { useEffect, useState } from 'react'
import { Search, UserPlus, LogOut, Building2, DoorOpen, BedDouble, User, CheckCircle, XCircle, RefreshCw, Home, AlertCircle } from 'lucide-react'

type Student = { studentID: string; name: string; dormBuilding?: string; roomNumber?: string; bedNumber?: string }
type Building = { buildingID: number; buildingName: string }
type Room = { roomID: number; roomNumber: string; currentOccupancy: number; capacity: number }
type Bed = { bedID: number; bedNumber: string; status: string; studentName?: string }

export default function CheckInPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [beds, setBeds] = useState<Bed[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [selectedBed, setSelectedBed] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [studentsRes, buildingsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/dormitories'),
      ])
      setStudents(await studentsRes.json())
      setBuildings(await buildingsRes.json())
    } catch (e) {
      // Error loading
    }
    setLoading(false)
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
    } catch (e: unknown) {
      const error = e as Error
      setMessage({ type: 'error', text: error?.message || 'Check-in failed' })
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
    } catch (e: unknown) {
      const error = e as Error
      setMessage({ type: 'error', text: error?.message || 'Check-out failed' })
    }
    setProcessing(false)
  }

  const checkedInStudents = students.filter((s) => s.dormBuilding && s.roomNumber && s.bedNumber)
  const unassignedStudents = students.filter((s) => !s.dormBuilding)

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading check-in data...</p>
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
              <UserPlus className="h-5 w-5" />
            </div>
            Check-In / Check-Out
          </h1>
          <p className="page-description mt-1">
            Manage student room assignments and bed allocations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{checkedInStudents.length}</p>
            <p className="stat-label">Checked In</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{unassignedStudents.length}</p>
            <p className="stat-label">Unassigned</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{buildings.length}</p>
            <p className="stat-label">Buildings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{students.length}</p>
            <p className="stat-label">Total Students</p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${
          message.type === 'success' 
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' 
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-In Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Check-In Student
            </h3>
          </div>

          {/* Student Search */}
          <div className="mb-4">
            <label className="input-label">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search by ID or name…"
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Search Results */}
          {search && (
            <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              {filteredStudents.filter((s) => !s.dormBuilding).slice(0, 10).map((s) => (
                <div
                  key={s.studentID}
                  onClick={() => { setSelectedStudent(s); setSearch('') }}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedStudent?.studentID === s.studentID ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.studentID}</p>
                  </div>
                </div>
              ))}
              {filteredStudents.filter((s) => !s.dormBuilding).length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500">No unassigned students found.</p>
              )}
            </div>
          )}

          {/* Selected Student */}
          {selectedStudent && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary-800 dark:text-primary-300">{selectedStudent.name}</p>
                <p className="text-sm text-primary-600 dark:text-primary-400">{selectedStudent.studentID}</p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Building / Room / Bed Selectors */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="input-label flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Building
              </label>
              <select
                className="input"
                value={selectedBuilding ?? ''}
                onChange={(e) => setSelectedBuilding(Number(e.target.value) || null)}
              >
                <option value="">Select a building...</option>
                {buildings.map((b) => <option key={b.buildingID} value={b.buildingID}>{b.buildingName}</option>)}
              </select>
            </div>
            
            <div>
              <label className="input-label flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5" />
                Room
              </label>
              <select
                className="input"
                value={selectedRoom ?? ''}
                onChange={(e) => setSelectedRoom(Number(e.target.value) || null)}
                disabled={!selectedBuilding}
              >
                <option value="">Select a room...</option>
                {rooms.map((r) => (
                  <option key={r.roomID} value={r.roomID}>
                    Room {r.roomNumber} ({r.currentOccupancy}/{r.capacity} occupied)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="input-label flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" />
                Bed
              </label>
              <select
                className="input"
                value={selectedBed ?? ''}
                onChange={(e) => setSelectedBed(Number(e.target.value) || null)}
                disabled={!selectedRoom}
              >
                <option value="">Select a bed...</option>
                {availableBeds.map((b) => <option key={b.bedID} value={b.bedID}>Bed #{b.bedNumber}</option>)}
              </select>
              {selectedRoom && availableBeds.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No available beds in this room.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={!selectedStudent || !selectedBed || processing}
            className="btn-primary w-full"
          >
            {processing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Assign Bed (Check-In)
              </>
            )}
          </button>
        </div>

        {/* Check-Out Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <LogOut className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              Currently Checked-In
            </h3>
            <span className="badge-info">{checkedInStudents.length} students</span>
          </div>
          
          {checkedInStudents.length === 0 ? (
            <div className="empty-state py-8">
              <Home className="empty-state-icon" />
              <p className="empty-state-title">No students checked in</p>
              <p className="empty-state-description">Students with room assignments will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {checkedInStudents.map((s) => (
                <div key={s.studentID} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {s.dormBuilding}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" />
                          Room {s.roomNumber}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" />
                          Bed {s.bedNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckOut(s.studentID)}
                    disabled={processing}
                    className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
