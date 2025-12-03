"use client"

import { useEffect, useState, useMemo } from 'react'
import { Building2, Users, Bed, DoorOpen, RefreshCw, AlertCircle, Flame, Thermometer, Eye, ChevronDown, ChevronUp, Info } from 'lucide-react'

type RoomOccupancy = {
  buildingName: string
  roomNumber: string
  capacity: number
  currentOccupancy: number
  occupancyRate: number
}

type BuildingData = {
  name: string
  rooms: RoomOccupancy[]
  totalCapacity: number
  totalOccupied: number
  avgRate: number
}

// Color scale for heatmap - from green (empty) to red (full)
const getHeatColor = (rate: number): string => {
  if (rate === 0) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
  if (rate < 25) return 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700'
  if (rate < 50) return 'bg-lime-100 dark:bg-lime-900/40 border-lime-300 dark:border-lime-700'
  if (rate < 75) return 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700'
  if (rate < 100) return 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700'
  return 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700'
}

const getHeatTextColor = (rate: number): string => {
  if (rate === 0) return 'text-gray-500 dark:text-gray-400'
  if (rate < 25) return 'text-emerald-700 dark:text-emerald-300'
  if (rate < 50) return 'text-lime-700 dark:text-lime-300'
  if (rate < 75) return 'text-yellow-700 dark:text-yellow-300'
  if (rate < 100) return 'text-orange-700 dark:text-orange-300'
  return 'text-red-700 dark:text-red-300'
}

const getHeatBgIntensity = (rate: number): string => {
  if (rate === 0) return 'opacity-30'
  if (rate < 25) return 'opacity-50'
  if (rate < 50) return 'opacity-60'
  if (rate < 75) return 'opacity-75'
  if (rate < 100) return 'opacity-85'
  return 'opacity-100'
}

export default function HeatmapPage() {
  const [rooms, setRooms] = useState<RoomOccupancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [hoveredRoom, setHoveredRoom] = useState<RoomOccupancy | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set())

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use the manager occupancy endpoint which queries vw_room_occupancy view
      const res = await fetch('/api/manager/occupancy?size=1000', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRooms(data.items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load occupancy data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Group rooms by building
  const buildingData = useMemo<BuildingData[]>(() => {
    const grouped = new Map<string, RoomOccupancy[]>()
    rooms.forEach(room => {
      const existing = grouped.get(room.buildingName) || []
      existing.push(room)
      grouped.set(room.buildingName, existing)
    })

    return Array.from(grouped.entries()).map(([name, roomList]) => {
      const totalCapacity = roomList.reduce((sum, r) => sum + r.capacity, 0)
      const totalOccupied = roomList.reduce((sum, r) => sum + r.currentOccupancy, 0)
      const avgRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0
      
      // Sort rooms by room number
      roomList.sort((a, b) => {
        const numA = parseInt(a.roomNumber) || 0
        const numB = parseInt(b.roomNumber) || 0
        return numA - numB
      })

      return { name, rooms: roomList, totalCapacity, totalOccupied, avgRate }
    }).sort((a, b) => b.avgRate - a.avgRate) // Sort buildings by occupancy rate
  }, [rooms])

  // Overall stats
  const overallStats = useMemo(() => {
    const totalRooms = rooms.length
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
    const totalOccupied = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0)
    const fullRooms = rooms.filter(r => r.occupancyRate >= 100).length
    const emptyRooms = rooms.filter(r => r.occupancyRate === 0).length
    const avgRate = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0
    
    return { totalRooms, totalCapacity, totalOccupied, fullRooms, emptyRooms, avgRate }
  }, [rooms])

  const toggleBuilding = (name: string) => {
    const newExpanded = new Set(expandedBuildings)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedBuildings(newExpanded)
  }

  const filteredBuildings = selectedBuilding 
    ? buildingData.filter(b => b.name === selectedBuilding)
    : buildingData

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">正在加载入住热力图...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">加载失败</p>
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
    <div className="container-section space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <Flame className="h-5 w-5" />
            </div>
            入住热力图
          </h1>
          <p className="page-description mt-1">
            可视化显示各楼栋房间入住情况，颜色越深表示入住率越高
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost">
            <RefreshCw className="h-4 w-4" />
          </button>
          <select 
            className="input h-10 w-40"
            value={selectedBuilding || ''}
            onChange={(e) => setSelectedBuilding(e.target.value || null)}
          >
            <option value="">全部楼栋</option>
            {buildingData.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center gap-3">
            <DoorOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{overallStats.totalRooms}</p>
              <p className="text-sm text-blue-600/80 dark:text-blue-400/80">总房间数</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="flex items-center gap-3">
            <Bed className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{overallStats.totalCapacity}</p>
              <p className="text-sm text-purple-600/80 dark:text-purple-400/80">总床位数</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{overallStats.totalOccupied}</p>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">已入住</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{overallStats.fullRooms}</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">满员房间</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
          <div className="flex items-center gap-3">
            <DoorOpen className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{overallStats.emptyRooms}</p>
              <p className="text-sm text-gray-600/80 dark:text-gray-400/80">空置房间</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="flex items-center gap-3">
            <Thermometer className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{overallStats.avgRate.toFixed(1)}%</p>
              <p className="text-sm text-orange-600/80 dark:text-orange-400/80">平均入住率</p>
            </div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">颜色说明：</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-8 rounded border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">空置 0%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-8 rounded border border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/40"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">1-24%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-8 rounded border border-lime-300 bg-lime-100 dark:border-lime-700 dark:bg-lime-900/40"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">25-49%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-8 rounded border border-yellow-300 bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/40"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">50-74%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-8 rounded border border-orange-300 bg-orange-100 dark:border-orange-700 dark:bg-orange-900/40"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">75-99%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-8 rounded border border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/40"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">满员 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hovered Room Details */}
      {hoveredRoom && (
        <div className="fixed bottom-6 right-6 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 ${getHeatColor(hoveredRoom.occupancyRate)}`}>
              <DoorOpen className={`h-6 w-6 ${getHeatTextColor(hoveredRoom.occupancyRate)}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{hoveredRoom.roomNumber}号房间</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{hoveredRoom.buildingName}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{hoveredRoom.currentOccupancy}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">已入住</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{hoveredRoom.capacity}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">总床位</p>
            </div>
            <div className={`rounded-lg p-2 ${getHeatColor(hoveredRoom.occupancyRate)}`}>
              <p className={`text-lg font-bold ${getHeatTextColor(hoveredRoom.occupancyRate)}`}>{hoveredRoom.occupancyRate}%</p>
              <p className="text-xs opacity-80">入住率</p>
            </div>
          </div>
        </div>
      )}

      {/* Buildings Heatmap */}
      <div className="space-y-6">
        {filteredBuildings.map((building) => (
          <div key={building.name} className="card overflow-hidden p-0">
            {/* Building Header */}
            <button
              onClick={() => toggleBuilding(building.name)}
              className="flex w-full items-center justify-between bg-gradient-to-r from-gray-50 to-white p-4 text-left transition-colors hover:from-gray-100 dark:from-gray-800 dark:to-gray-800/50 dark:hover:from-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${getHeatColor(building.avgRate)}`}>
                  <Building2 className={`h-7 w-7 ${getHeatTextColor(building.avgRate)}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{building.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {building.rooms.length} 个房间 · {building.totalOccupied}/{building.totalCapacity} 床位已入住
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Mini progress bar */}
                <div className="hidden w-32 sm:block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">入住率</span>
                    <span className={`font-semibold ${getHeatTextColor(building.avgRate)}`}>{building.avgRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        building.avgRate < 50 ? 'bg-emerald-500' : 
                        building.avgRate < 75 ? 'bg-yellow-500' : 
                        building.avgRate < 100 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(building.avgRate, 100)}%` }}
                    />
                  </div>
                </div>
                {expandedBuildings.has(building.name) ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Rooms Grid */}
            {expandedBuildings.has(building.name) && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                  {building.rooms.map((room) => (
                    <div
                      key={`${building.name}-${room.roomNumber}`}
                      className={`group relative cursor-pointer rounded-lg border-2 p-2 text-center transition-all hover:scale-105 hover:shadow-lg ${getHeatColor(room.occupancyRate)}`}
                      onMouseEnter={() => setHoveredRoom(room)}
                      onMouseLeave={() => setHoveredRoom(null)}
                    >
                      <p className={`text-sm font-bold ${getHeatTextColor(room.occupancyRate)}`}>
                        {room.roomNumber}
                      </p>
                      <p className={`text-xs ${getHeatTextColor(room.occupancyRate)} opacity-80`}>
                        {room.currentOccupancy}/{room.capacity}
                      </p>
                      {/* Full indicator */}
                      {room.occupancyRate >= 100 && (
                        <div className="absolute -right-1 -top-1">
                          <span className="flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBuildings.length === 0 && (
        <div className="card">
          <div className="empty-state py-12">
            <Building2 className="empty-state-icon" />
            <p className="empty-state-title">未找到楼栋数据</p>
            <p className="empty-state-description">
              请检查数据库连接或选择其他楼栋
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
