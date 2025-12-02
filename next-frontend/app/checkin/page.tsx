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
      setMessage({ type: 'success', text: '入住成功！' })
      setSelectedStudent(null)
      setSelectedBed(null)
      load()
    } catch (e: unknown) {
      const error = e as Error
      setMessage({ type: 'error', text: error?.message || '入住失败' })
    }
    setProcessing(false)
  }

  const handleCheckOut = async (studentId: string) => {
    if (!confirm('确定为该学生办理退住？')) return
    setProcessing(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/dormitories/check-out/${studentId}`, { method: 'POST' })
      const text = await res.text()
      if (!res.ok) throw new Error(text)
      setMessage({ type: 'success', text: '退住成功！' })
      load()
    } catch (e: unknown) {
      const error = e as Error
      setMessage({ type: 'error', text: error?.message || '退住失败' })
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载入住数据...</p>
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
            入住 / 退住管理
          </h1>
          <p className="page-description mt-1">
            管理学生房间分配和床位安排
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
            <p className="stat-label">已入住</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{unassignedStudents.length}</p>
            <p className="stat-label">未分配</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{buildings.length}</p>
            <p className="stat-label">楼栋数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{students.length}</p>
            <p className="stat-label">学生总数</p>
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
              学生入住
            </h3>
          </div>

          {/* Student Search */}
          <div className="mb-4">
            <label className="input-label">搜索学生</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="按学号或姓名搜索..."
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
                <p className="px-4 py-3 text-sm text-gray-500">没有未分配的学生。</p>
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
                楼栋
              </label>
              <select
                className="input"
                value={selectedBuilding ?? ''}
                onChange={(e) => setSelectedBuilding(Number(e.target.value) || null)}
              >
                <option value="">请选择楼栋...</option>
                {buildings.map((b) => <option key={b.buildingID} value={b.buildingID}>{b.buildingName}</option>)}
              </select>
            </div>
            
            <div>
              <label className="input-label flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5" />
                房间
              </label>
              <select
                className="input"
                value={selectedRoom ?? ''}
                onChange={(e) => setSelectedRoom(Number(e.target.value) || null)}
                disabled={!selectedBuilding}
              >
                <option value="">请选择房间...</option>
                {rooms.map((r) => (
                  <option key={r.roomID} value={r.roomID}>
                    {r.roomNumber}室 ({r.currentOccupancy}/{r.capacity} 已入住)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="input-label flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" />
                床位
              </label>
              <select
                className="input"
                value={selectedBed ?? ''}
                onChange={(e) => setSelectedBed(Number(e.target.value) || null)}
                disabled={!selectedRoom}
              >
                <option value="">请选择床位...</option>
                {availableBeds.map((b) => <option key={b.bedID} value={b.bedID}>{b.bedNumber}号床</option>)}
              </select>
              {selectedRoom && availableBeds.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">该房间没有可用床位。</p>
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
                处理中...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                分配床位（入住）
              </>
            )}
          </button>
        </div>

        {/* Check-Out Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <LogOut className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              当前入住学生
            </h3>
            <span className="badge-info">{checkedInStudents.length} 名学生</span>
          </div>
          
          {checkedInStudents.length === 0 ? (
            <div className="empty-state py-8">
              <Home className="empty-state-icon" />
              <p className="empty-state-title">暂无入住学生</p>
              <p className="empty-state-description">已分配房间的学生将显示在此。</p>
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
                          {s.roomNumber}室
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" />
                          {s.bedNumber}号床
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
                    退住
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
