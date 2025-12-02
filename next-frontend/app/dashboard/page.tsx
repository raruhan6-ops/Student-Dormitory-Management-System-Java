"use client"

import { useEffect, useState } from 'react'

type OccupancyRow = {
  buildingName: string
  roomNumber: string
  capacity: number
  currentOccupancy: number
  occupancyRate: number
}

type OccupancyPage = {
  items: OccupancyRow[]
  total: number
  page: number
  size: number
}

export default function DashboardPage() {
  const [rows, setRows] = useState<OccupancyRow[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState('')
  const [room, setRoom] = useState('')
  const [minRate, setMinRate] = useState<string>('')
  const [maxRate, setMaxRate] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<'building'|'room'|'capacity'|'current'|'rate'>('building')
  const [order, setOrder] = useState<'asc'|'desc'>('asc')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), size: String(pageSize) })
        if (building) params.append('building', building)
        if (room) params.append('room', room)
        if (minRate !== '' && !Number.isNaN(Number(minRate))) params.append('minRate', String(Number(minRate)))
        if (maxRate !== '' && !Number.isNaN(Number(maxRate))) params.append('maxRate', String(Number(maxRate)))
        if (sort) params.append('sort', sort)
        if (order) params.append('order', order)
        const res = await fetch(`/api/manager/occupancy?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: OccupancyPage = await res.json()
        setRows(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number(data?.total || 0))
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load occupancy')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, pageSize, building, room, minRate, maxRate, sort, order])

  const filtered = rows.filter((r) => {
    if (building && !r.buildingName?.toLowerCase().includes(building.toLowerCase())) return false
    if (room && !r.roomNumber?.toLowerCase().includes(room.toLowerCase())) return false
    const rate = Number(r.occupancyRate)
    if (minRate !== '' && !Number.isNaN(Number(minRate)) && rate < Number(minRate)) return false
    if (maxRate !== '' && !Number.isNaN(Number(maxRate)) && rate > Number(maxRate)) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  return (
    <section className="container-section">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Room occupancy pulled from the backend view.
      </p>

      {loading && <p className="mt-6">Loading…</p>}
      {error && (
        <p className="mt-6 text-red-600">
          Failed to load room occupancy: {error}
        </p>
      )}

      {!loading && !error && (
        <div className="mt-6">
          {/* Filters */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              placeholder="Filter by building"
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={building}
              onChange={(e) => { setBuilding(e.target.value); setPage(1) }}
            />
            <input
              placeholder="Filter by room"
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={room}
              onChange={(e) => { setRoom(e.target.value); setPage(1) }}
            />
            <input
              placeholder="Min rate %"
              type="number"
              min={0}
              max={100}
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={minRate}
              onChange={(e) => { setMinRate(e.target.value); setPage(1) }}
            />
            <input
              placeholder="Max rate %"
              type="number"
              min={0}
              max={100}
              className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={maxRate}
              onChange={(e) => { setMaxRate(e.target.value); setPage(1) }}
            />
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {rows.length} items on this page • Total (server): {total}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm">Sort</label>
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={sort}
                onChange={(e) => { setSort(e.target.value as any); setPage(1) }}
              >
                <option value="building">Building</option>
                <option value="room">Room</option>
                <option value="capacity">Capacity</option>
                <option value="current">Current</option>
                <option value="rate">Rate</option>
              </select>
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={order}
                onChange={(e) => { setOrder(e.target.value as any); setPage(1) }}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <label className="text-sm">Page size</label>
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              >
                {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">Building</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Room</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Capacity</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Current</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Rate (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {rows.map((r, i) => (
                <tr key={`${r.buildingName}-${r.roomNumber}-${i}`}>
                  <td className="px-4 py-2 text-sm">{r.buildingName}</td>
                  <td className="px-4 py-2 text-sm">{r.roomNumber}</td>
                  <td className="px-4 py-2 text-sm">{r.capacity}</td>
                  <td className="px-4 py-2 text-sm">{r.currentOccupancy}</td>
                  <td className="px-4 py-2 text-sm">{Number(r.occupancyRate).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No occupancy data.</p>
          )}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <button
              className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </button>
            <p className="text-sm">Page {currentPage} of {totalPages}</p>
            <button
              className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
