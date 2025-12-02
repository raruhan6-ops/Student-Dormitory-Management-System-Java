"use client"

import { useEffect, useState } from 'react'
import { Plus, ChevronRight, ChevronDown, Pencil, Trash2, X, RefreshCw } from 'lucide-react'

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
    if (!confirm('Delete this building?')) return
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
    if (!confirm('Delete this room?')) return
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
      alert('Failed to sync beds')
    }
    setSyncing(false)
  }

  return (
    <section className="container-section">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Buildings &amp; Rooms</h2>
        <div className="flex gap-2">
          <button 
            onClick={syncBeds} 
            disabled={syncing}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Beds'}
          </button>
          <button onClick={openAddBuilding} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            <Plus size={16} /> Add Building
          </button>
        </div>
      </div>

      {loading && <p>Loading…</p>}

      <div className="space-y-2">
        {buildings.map((b) => (
          <div key={b.buildingID} className="rounded-md border border-gray-200 dark:border-gray-700">
            {/* Building Header */}
            <div
              className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 dark:bg-gray-900/40"
              onClick={() => toggleBuilding(b.buildingID)}
            >
              <div className="flex items-center gap-2">
                {expandedBuilding === b.buildingID ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span className="font-medium">{b.buildingName}</span>
                <span className="text-sm text-gray-500">({b.location})</span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEditBuilding(b)} className="text-blue-600 hover:underline"><Pencil size={16} /></button>
                <button onClick={() => deleteBuilding(b.buildingID)} className="text-red-600 hover:underline"><Trash2 size={16} /></button>
              </div>
            </div>

            {/* Rooms */}
            {expandedBuilding === b.buildingID && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between bg-gray-100 px-6 py-2 dark:bg-gray-800/40">
                  <span className="text-sm font-medium">Rooms</span>
                  <button onClick={() => openAddRoom(b.buildingID)} className="text-sm text-blue-600 hover:underline">+ Add Room</button>
                </div>
                {(rooms[b.buildingID] || []).length === 0 && (
                  <p className="px-6 py-2 text-sm text-gray-500">No rooms yet.</p>
                )}
                {(rooms[b.buildingID] || []).map((r) => (
                  <div key={r.roomID} className="border-t border-gray-100 dark:border-gray-800">
                    <div
                      className="flex cursor-pointer items-center justify-between px-6 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      onClick={() => toggleRoom(r.roomID)}
                    >
                      <div className="flex items-center gap-2">
                        {expandedRoom === r.roomID ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span>Room {r.roomNumber}</span>
                        <span className="text-xs text-gray-500">({r.currentOccupancy}/{r.capacity})</span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => deleteRoom(r.roomID, b.buildingID)} className="text-red-600 hover:underline"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Beds */}
                    {expandedRoom === r.roomID && (
                      <div className="bg-gray-50 px-8 py-2 dark:bg-gray-900/30">
                        <p className="mb-1 text-xs font-medium text-gray-500">Beds</p>
                        {(beds[r.roomID] || []).length === 0 && <p className="text-xs text-gray-400">No beds.</p>}
                        <div className="flex flex-wrap gap-2">
                          {(beds[r.roomID] || []).map((bed) => (
                            <div
                              key={bed.bedID}
                              className={`rounded px-3 py-1 text-xs ${bed.status === 'Occupied' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}
                            >
                              #{bed.bedNumber} {bed.studentName ? `- ${bed.studentName}` : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {buildings.length === 0 && !loading && <p className="text-gray-500">No buildings found.</p>}
      </div>

      {/* Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{modal.type === 'building' ? (modal.edit ? 'Edit Building' : 'Add Building') : 'Add Room'}</h3>
              <button onClick={() => setModal({ type: null, edit: false })} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            {modal.type === 'building' && (
              <div className="space-y-3">
                <input placeholder="Building Name" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={buildingForm.buildingName || ''} onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })} />
                <input placeholder="Location" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={buildingForm.location || ''} onChange={(e) => setBuildingForm({ ...buildingForm, location: e.target.value })} />
                <input placeholder="Manager Name" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={buildingForm.managerName || ''} onChange={(e) => setBuildingForm({ ...buildingForm, managerName: e.target.value })} />
                <input placeholder="Manager Phone" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={buildingForm.managerPhone || ''} onChange={(e) => setBuildingForm({ ...buildingForm, managerPhone: e.target.value })} />
              </div>
            )}

            {modal.type === 'room' && (
              <div className="space-y-3">
                <input placeholder="Room Number" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={roomForm.roomNumber || ''} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} />
                <input placeholder="Capacity" type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={roomForm.capacity || 4} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} />
                <input placeholder="Room Type" className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={roomForm.roomType || ''} onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })} />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModal({ type: null, edit: false })} className="rounded-md border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button>
              <button onClick={modal.type === 'building' ? saveBuilding : saveRoom} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
