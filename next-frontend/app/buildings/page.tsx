"use client"

import { useEffect, useState } from 'react'
import { Plus, ChevronRight, ChevronDown, Pencil, Trash2, X, RefreshCw, Building2, DoorOpen, BedDouble, MapPin, User, Phone, Users, AlertCircle, Home } from 'lucide-react'

type Building = {
  buildingID: number
  buildingName: string
  location: string
  managerName: string
  managerPhone: string
}

type Room = {
  roomID: number
  buildingID: number
  roomNumber: string
  capacity: number
  currentOccupancy: number
  roomType: string
}

type Bed = {
  bedID: number
  roomID: number
  bedNumber: string
  status: string
  studentID?: string
  studentName?: string
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [expandedBuilding, setExpandedBuilding] = useState<number | null>(null)
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null)
  const [rooms, setRooms] = useState<Record<number, Room[]>>({})
  const [beds, setBeds] = useState<Record<number, Bed[]>>({})
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modal, setModal] = useState<{ type: 'building' | 'room' | null; edit: boolean; parentId?: number }>({ type: null, edit: false })
  const [buildingForm, setBuildingForm] = useState<Partial<Building>>({})
  const [roomForm, setRoomForm] = useState<Partial<Room>>({})

  const loadBuildings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dormitories')
      const data = await res.json()
      setBuildings(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  const loadRooms = async (buildingId: number) => {
    try {
      const res = await fetch(`/api/dormitories/${buildingId}/rooms`)
      const data = await res.json()
      setRooms((prev) => ({ ...prev, [buildingId]: Array.isArray(data) ? data : [] }))
    } catch { /* ignore */ }
  }

  const loadBeds = async (roomId: number) => {
    try {
      const res = await fetch(`/api/dormitories/rooms/${roomId}/beds`)
      const data = await res.json()
      setBeds((prev) => ({ ...prev, [roomId]: Array.isArray(data) ? data : [] }))
    } catch { /* ignore */ }
  }

  useEffect(() => { loadBuildings() }, [])

  const toggleBuilding = (id: number) => {
    if (expandedBuilding === id) {
      setExpandedBuilding(null)
    } else {
      setExpandedBuilding(id)
      if (!rooms[id]) loadRooms(id)
    }
  }

  const toggleRoom = (id: number) => {
    if (expandedRoom === id) {
      setExpandedRoom(null)
    } else {
      setExpandedRoom(id)
      if (!beds[id]) loadBeds(id)
    }
  }

  // Building CRUD
  const openAddBuilding = () => {
    setBuildingForm({ buildingName: '', location: '', managerName: '', managerPhone: '' })
    setModal({ type: 'building', edit: false })
  }
  const openEditBuilding = (b: Building) => {
    setBuildingForm({ ...b })
    setModal({ type: 'building', edit: true })
  }
  const saveBuilding = async () => {
    const url = modal.edit ? `/api/dormitories/${buildingForm.buildingID}` : '/api/dormitories'
    const method = modal.edit ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildingForm) })
    setModal({ type: null, edit: false })
    loadBuildings()
  }
  const deleteBuilding = async (id: number) => {
    if (!confirm('确定删除该楼栋？')) return
    const res = await fetch(`/api/dormitories/${id}`, { method: 'DELETE' })
    if (!res.ok) alert(await res.text())
    else loadBuildings()
  }

  // Room CRUD
  const openAddRoom = (buildingId: number) => {
    setRoomForm({ roomNumber: '', capacity: 4, currentOccupancy: 0, roomType: 'Standard' })
    setModal({ type: 'room', edit: false, parentId: buildingId })
  }
  const saveRoom = async () => {
    const url = `/api/dormitories/${modal.parentId}/rooms`
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomForm) })
    setModal({ type: null, edit: false })
    if (modal.parentId) loadRooms(modal.parentId)
  }
  const deleteRoom = async (roomId: number, buildingId: number) => {
    if (!confirm('确定删除该房间？')) return
    const res = await fetch(`/api/dormitories/rooms/${roomId}`, { method: 'DELETE' })
    if (!res.ok) alert(await res.text())
    else loadRooms(buildingId)
  }

  // Sync beds for all rooms (creates missing beds based on capacity)
  const [syncing, setSyncing] = useState(false)
  const syncBeds = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/dormitories/sync-beds', { method: 'POST' })
      const message = await res.text()
      alert(message)
      // Reload all expanded data
      if (expandedBuilding) loadRooms(expandedBuilding)
      if (expandedRoom) loadBeds(expandedRoom)
    } catch (e) {
      alert('同步床位失败')
    }
    setSyncing(false)
  }

  // Calculate stats
  const totalRooms = Object.values(rooms).flat().length
  const totalBeds = Object.values(beds).flat().length

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载楼栋数据...</p>
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
              <Building2 className="h-5 w-5" />
            </div>
            楼栋与房间管理
          </h1>
          <p className="page-description mt-1">
            管理宿舍楼栋、房间和床位分配
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={syncBeds} 
            disabled={syncing}
            className="btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步床位'}
          </button>
          <button onClick={openAddBuilding} className="btn-primary">
            <Plus className="h-4 w-4" />
            添加楼栋
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{buildings.length}</p>
            <p className="stat-label">楼栋数量</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{totalRooms || '-'}</p>
            <p className="stat-label">已加载房间</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{totalBeds || '-'}</p>
            <p className="stat-label">已加载床位</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{Object.values(beds).flat().filter(b => b.status === 'Occupied').length || '-'}</p>
            <p className="stat-label">已入住床位</p>
          </div>
        </div>
      </div>

      {/* Buildings List */}
      {buildings.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <Building2 className="empty-state-icon" />
            <p className="empty-state-title">未找到楼栋</p>
            <p className="empty-state-description">创建第一个楼栋以开始使用。</p>
            <button onClick={openAddBuilding} className="btn-primary mt-4">
              <Plus className="h-4 w-4" />
              添加楼栋
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {buildings.map((b) => (
            <div key={b.buildingID} className="card overflow-hidden p-0">
              {/* Building Header */}
              <div
                className="flex cursor-pointer items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 transition-colors hover:from-gray-100 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-800 dark:hover:from-gray-800"
                onClick={() => toggleBuilding(b.buildingID)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-transform dark:bg-primary-900/30 dark:text-primary-400">
                    {expandedBuilding === b.buildingID ? <ChevronDown className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{b.buildingName}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {b.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {b.managerName || '无管理员'}
                      </span>
                      {b.managerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {b.managerPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="badge-info mr-2">
                    {rooms[b.buildingID]?.length || 0} 个房间
                  </span>
                  <button onClick={() => openEditBuilding(b)} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteBuilding(b.buildingID)} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Rooms Section */}
              {expandedBuilding === b.buildingID && (
                <div className="bg-gray-50/50 dark:bg-gray-900/20">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 dark:border-gray-700">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <DoorOpen className="h-4 w-4" />
                      房间列表
                    </span>
                    <button onClick={() => openAddRoom(b.buildingID)} className="btn-ghost text-sm">
                      <Plus className="h-4 w-4" />
                      添加房间
                    </button>
                  </div>
                  
                  {(rooms[b.buildingID] || []).length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <DoorOpen className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">该楼栋暂无房间。</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {(rooms[b.buildingID] || []).map((r) => (
                        <div key={r.roomID}>
                          <div
                            className="flex cursor-pointer items-center justify-between px-6 py-3 transition-colors hover:bg-white dark:hover:bg-gray-800/50"
                            onClick={() => toggleRoom(r.roomID)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                {expandedRoom === r.roomID ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{r.roomNumber}室</span>
                                <span className="ml-2 text-sm text-gray-500">({r.roomType})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${r.currentOccupancy >= r.capacity ? 'bg-red-500' : r.currentOccupancy > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{r.currentOccupancy}/{r.capacity}</span>
                              </div>
                              <button onClick={() => deleteRoom(r.roomID, b.buildingID)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Beds Section */}
                          {expandedRoom === r.roomID && (
                            <div className="border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800/30">
                              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                                <BedDouble className="h-3.5 w-3.5" />
                                床位列表
                              </div>
                              {(beds[r.roomID] || []).length === 0 ? (
                                <p className="text-sm text-gray-400">未配置床位，请点击"同步床位"创建床位。</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {(beds[r.roomID] || []).map((bed) => (
                                    <div
                                      key={bed.bedID}
                                      className={`flex items-center gap-2 rounded-lg border p-3 ${
                                        bed.status === 'Occupied' 
                                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                                          : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                                      }`}
                                    >
                                      <BedDouble className={`h-4 w-4 ${bed.status === 'Occupied' ? 'text-red-500' : 'text-emerald-500'}`} />
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium ${bed.status === 'Occupied' ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                          {bed.bedNumber}号床
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                          {bed.studentName || '可用'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.type && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                {modal.type === 'building' ? (
                  <>
                    <Building2 className="h-5 w-5 text-primary-600" />
                    {modal.edit ? '编辑楼栋' : '添加楼栋'}
                  </>
                ) : (
                  <>
                    <DoorOpen className="h-5 w-5 text-primary-600" />
                    添加房间
                  </>
                )}
              </h3>
              <button onClick={() => setModal({ type: null, edit: false })} className="modal-close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-body">
              {modal.type === 'building' && (
                <div className="space-y-4">
                  <div>
                    <label className="input-label">楼栋名称</label>
                    <input 
                      placeholder="例如：A栋" 
                      className="input" 
                      value={buildingForm.buildingName || ''} 
                      onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="input-label">位置</label>
                    <input 
                      placeholder="例如：北区" 
                      className="input" 
                      value={buildingForm.location || ''} 
                      onChange={(e) => setBuildingForm({ ...buildingForm, location: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="input-label">管理员姓名</label>
                    <input 
                      placeholder="例如：张三" 
                      className="input" 
                      value={buildingForm.managerName || ''} 
                      onChange={(e) => setBuildingForm({ ...buildingForm, managerName: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="input-label">管理员电话</label>
                    <input 
                      placeholder="例如：13800138000" 
                      className="input" 
                      value={buildingForm.managerPhone || ''} 
                      onChange={(e) => setBuildingForm({ ...buildingForm, managerPhone: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {modal.type === 'room' && (
                <div className="space-y-4">
                  <div>
                    <label className="input-label">房间号</label>
                    <input 
                      placeholder="例如：101" 
                      className="input" 
                      value={roomForm.roomNumber || ''} 
                      onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="input-label">床位数</label>
                    <input 
                      placeholder="4" 
                      type="number" 
                      min="1"
                      max="10"
                      className="input" 
                      value={roomForm.capacity || 4} 
                      onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} 
                    />
                  </div>
                  <div>
                    <label className="input-label">房间类型</label>
                    <select 
                      className="input" 
                      value={roomForm.roomType || 'Standard'} 
                      onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                    >
                      <option value="Standard">标准间</option>
                      <option value="Premium">豪华间</option>
                      <option value="Suite">套间</option>
                      <option value="Accessible">无障碍间</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setModal({ type: null, edit: false })} className="btn-secondary">取消</button>
              <button onClick={modal.type === 'building' ? saveBuilding : saveRoom} className="btn-primary">
                {modal.edit ? '保存修改' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
