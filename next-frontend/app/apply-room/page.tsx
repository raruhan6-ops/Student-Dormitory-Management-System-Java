"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, DoorOpen, BedDouble, Check, AlertCircle, RefreshCw, User, MapPin, Clock, Home, CheckCircle } from 'lucide-react'

type BedInfo = {
  bedID: number
  bedNumber: string
  status: string  // Available, Occupied, Reserved
  isAvailable: boolean
}

type AvailableBed = {
  bedID: number
  bedNumber: string
}

type AvailableRoom = {
  roomID: number
  roomNumber: string
  roomType: string
  capacity: number
  currentOccupancy: number
  availableSpots: number
  allBeds: BedInfo[]
  availableBeds: AvailableBed[]
}

type AvailableBuilding = {
  buildingID: number
  buildingName: string
  location: string
  rooms: AvailableRoom[]
}

export default function ApplyRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [buildings, setBuildings] = useState<AvailableBuilding[]>([])
  const [selectedBed, setSelectedBed] = useState<number | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<AvailableBuilding | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [hasRoom, setHasRoom] = useState(false)
  const [hasPendingApplication, setHasPendingApplication] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileRes = await fetch('/api/student-portal/profile')
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (!profile) {
            setHasProfile(false)
            setLoading(false)
            return
          }
          setHasProfile(true)
          
          if (profile.dormBuilding && profile.roomNumber) {
            setHasRoom(true)
            setLoading(false)
            return
          }
        } else {
          setHasProfile(false)
          setLoading(false)
          return
        }

        const appsRes = await fetch('/api/student-portal/my-applications', { credentials: 'include' })
        if (appsRes.ok) {
          const apps = await appsRes.json()
          if (apps.some((a: { status: string }) => a.status === 'Pending')) {
            setHasPendingApplication(true)
            setLoading(false)
            return
          }
        }

        const roomsRes = await fetch('/api/student-portal/available-rooms')
        if (roomsRes.ok) {
          const data = await roomsRes.json()
          setBuildings(data)
        }
      } catch (e) {
        setMessage({ type: 'error', text: '加载数据失败' })
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSelectBed = (building: AvailableBuilding, room: AvailableRoom, bedID: number) => {
    setSelectedBuilding(building)
    setSelectedRoom(room)
    setSelectedBed(bedID)
    setMessage(null)
  }

  const handleApply = async () => {
    if (!selectedBed) return

    setApplying(true)
    setMessage(null)

    try {
      const res = await fetch('/api/student-portal/apply-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedID: selectedBed })
      })

      const data = await res.json()
      
      if (!res.ok) {
        // Handle concurrent booking conflict (409 status)
        if (res.status === 409) {
          const errorMsg = data.error || '该床位刚被其他学生预定。'
          setMessage({ 
            type: 'error', 
            text: `${errorMsg} 请选择其他床位。`
          })
          // Refresh the available rooms to get updated data
          setSelectedBed(null)
          setSelectedRoom(null)
          setSelectedBuilding(null)
          const roomsRes = await fetch('/api/student-portal/available-rooms')
          if (roomsRes.ok) {
            const updatedData = await roomsRes.json()
            setBuildings(updatedData)
          }
          return
        }
        throw new Error(typeof data === 'string' ? data : data.error || data.message || 'Application failed')
      }

      setMessage({ 
        type: 'success', 
        text: `申请已提交！${data.building} - ${data.room}室 ${data.bed}号床。等待管理员审批。` 
      })
      
      setTimeout(() => {
        router.push('/profile')
      }, 2500)
    } catch (e: unknown) {
      const error = e as Error
      setMessage({ type: 'error', text: error.message || 'Failed to apply for room' })
    } finally {
      setApplying(false)
    }
  }

  // Calculate stats
  const totalBuildings = buildings.length
  const totalAvailableBeds = buildings.reduce(
    (acc, b) => acc + b.rooms.reduce((roomAcc, r) => roomAcc + (r.availableBeds?.length || 0), 0),
    0
  )
  const totalBeds = buildings.reduce(
    (acc, b) => acc + b.rooms.reduce((roomAcc, r) => roomAcc + (r.allBeds?.length || r.availableBeds?.length || 0), 0),
    0
  )
  const totalOccupiedBeds = totalBeds - totalAvailableBeds

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载可用房间...</p>
        </div>
      </div>
    )
  }

  if (hasProfile === false) {
    return (
      <div className="container-section">
        <div className="mx-auto max-w-md">
          <div className="card bg-gradient-to-br from-amber-50 to-white p-8 text-center dark:from-amber-900/20 dark:to-gray-800">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <User className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">需要完善资料</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              申请房间前，您需要先创建学生资料。
            </p>
            <button
              onClick={() => router.push('/profile/setup')}
              className="btn-primary mt-6 w-full"
            >
              <User className="h-4 w-4" />
              创建个人资料
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (hasRoom) {
    return (
      <div className="container-section">
        <div className="mx-auto max-w-md">
          <div className="card bg-gradient-to-br from-emerald-50 to-white p-8 text-center dark:from-emerald-900/20 dark:to-gray-800">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <Home className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">已分配房间</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              您已被分配房间。请在个人资料中查看详情。
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="btn-primary mt-6 w-full"
            >
              <User className="h-4 w-4" />
              查看资料
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (hasPendingApplication) {
    return (
      <div className="container-section">
        <div className="mx-auto max-w-md">
          <div className="card bg-gradient-to-br from-blue-50 to-white p-8 text-center dark:from-blue-900/20 dark:to-gray-800">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">申请待审核</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              您已有待审核的房间申请，请等待管理员审批。
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="btn-primary mt-6 w-full"
            >
              <User className="h-4 w-4" />
              查看申请状态
            </button>
          </div>
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
              <BedDouble className="h-5 w-5" />
            </div>
            申请房间
          </h1>
          <p className="page-description mt-1">
            从下方楼栋中选择可用床位
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{totalBuildings}</p>
            <p className="stat-label">楼栋数量</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value text-emerald-600 dark:text-emerald-400">{totalAvailableBeds}</p>
            <p className="stat-label">可用床位</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value text-red-600 dark:text-red-400">{totalOccupiedBeds}</p>
            <p className="stat-label">已占用床位</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-value">{buildings.reduce((acc, b) => acc + b.rooms.length, 0)}</p>
            <p className="stat-label">房间总数</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${
          message.type === 'success' 
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' 
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {buildings.length === 0 ? (
        <div className="card">
          <div className="empty-state py-12">
            <BedDouble className="empty-state-icon" />
            <p className="empty-state-title">暂无可用房间</p>
            <p className="empty-state-description">
              目前没有可用床位，请稍后再试。
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {buildings.map((building) => (
            <div key={building.buildingID} className="card overflow-hidden p-0">
              <div className="border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white px-6 py-4 dark:border-gray-700 dark:from-primary-900/20 dark:to-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{building.buildingName}</h3>
                    <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {building.location}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {building.rooms.map((room) => (
                    <div
                      key={room.roomID}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        selectedRoom?.roomID === room.roomID
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                          : 'border-gray-100 hover:border-gray-200 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-white">{room.roomNumber}室</span>
                        </div>
                        <span className="badge-info">{room.roomType}</span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">可用情况</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {room.availableSpots} / {room.capacity}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div 
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${(room.availableSpots / room.capacity) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded border-2 border-emerald-500 bg-emerald-50"></div>
                          <span className="text-gray-500">可用</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded bg-red-500"></div>
                          <span className="text-gray-500">已占用</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded bg-amber-500"></div>
                          <span className="text-gray-500">已预约</span>
                        </div>
                      </div>

                      {/* All Beds Display */}
                      <div className="flex flex-wrap gap-2">
                        {(room.allBeds || room.availableBeds.map(b => ({ ...b, status: 'Available', isAvailable: true }))).map((bed) => {
                          const isAvailable = bed.isAvailable || bed.status === 'Available'
                          const isOccupied = bed.status === 'Occupied'
                          const isReserved = bed.status === 'Reserved'
                          const isSelected = selectedBed === bed.bedID
                          
                          return (
                            <button
                              key={bed.bedID}
                              onClick={() => isAvailable && handleSelectBed(building, room, bed.bedID)}
                              disabled={!isAvailable}
                              title={isAvailable ? `选择 ${bed.bedNumber}号床` : `${bed.bedNumber}号床 ${bed.status === 'Occupied' ? '已占用' : '已预约'}`}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-500 text-white shadow-md ring-2 ring-primary-300'
                                  : isOccupied
                                  ? 'cursor-not-allowed border-red-300 bg-red-100 text-red-700 opacity-75 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : isReserved
                                  ? 'cursor-not-allowed border-amber-300 bg-amber-100 text-amber-700 opacity-75 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100 hover:shadow-sm dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                              }`}
                            >
                              <BedDouble className={`h-4 w-4 ${isOccupied ? 'text-red-500' : isReserved ? 'text-amber-500' : ''}`} />
                              {bed.bedNumber}号床
                              {isSelected && <Check className="h-4 w-4" />}
                              {isOccupied && <span className="ml-1 text-xs">(已占)</span>}
                              {isReserved && <span className="ml-1 text-xs">(待审)</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selection Summary & Apply Button */}
      {selectedBed && selectedRoom && selectedBuilding && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800 lg:sticky lg:bottom-auto lg:left-auto lg:right-auto lg:mt-6 lg:rounded-xl lg:border">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <BedDouble className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">您的选择</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedBuilding.buildingName} → {selectedRoom.roomNumber}室 → {
                    selectedRoom.availableBeds.find(b => b.bedID === selectedBed)?.bedNumber
                  }号床
                </p>
              </div>
            </div>
            <button
              onClick={handleApply}
              disabled={applying}
              className="btn-primary w-full sm:w-auto"
            >
              {applying ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  确认申请
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
