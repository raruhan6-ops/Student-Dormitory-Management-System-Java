"use client"

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { Users, Building2, DoorOpen, Bed, Wrench, TrendingUp } from 'lucide-react'

type SummaryStats = {
  totalStudents: number
  totalBuildings: number
  totalRooms: number
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  occupancyRate: number
  pendingRepairs: number
  inProgressRepairs: number
}

type OccupancyByBuilding = { name: string; capacity: number; occupied: number; available: number; rate: number }
type RepairsByStatus = { status: string; count: number }
type StudentsByMajor = { major: string; count: number }
type StudentsByYear = { year: number; count: number }
type GenderDist = { gender: string; count: number }

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [occupancyByBuilding, setOccupancyByBuilding] = useState<OccupancyByBuilding[]>([])
  const [repairsByStatus, setRepairsByStatus] = useState<RepairsByStatus[]>([])
  const [studentsByMajor, setStudentsByMajor] = useState<StudentsByMajor[]>([])
  const [studentsByYear, setStudentsByYear] = useState<StudentsByYear[]>([])
  const [genderDist, setGenderDist] = useState<GenderDist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [summaryRes, buildingRes, repairsRes, majorRes, yearRes, genderRes] = await Promise.all([
          fetch('/api/stats/summary'),
          fetch('/api/stats/occupancy-by-building'),
          fetch('/api/stats/repairs-by-status'),
          fetch('/api/stats/students-by-major'),
          fetch('/api/stats/students-by-year'),
          fetch('/api/stats/gender-distribution'),
        ])

        if (!summaryRes.ok) throw new Error('Failed to fetch summary')
        
        setSummary(await summaryRes.json())
        setOccupancyByBuilding(await buildingRes.json())
        setRepairsByStatus(await repairsRes.json())
        setStudentsByMajor(await majorRes.json())
        setStudentsByYear(await yearRes.json())
        setGenderDist(await genderRes.json())
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <section className="container-section"><p>Loading dashboard…</p></section>
  if (error) return <section className="container-section"><p className="text-red-600">{error}</p></section>

  return (
    <section className="container-section space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users size={24} />} label="Total Students" value={summary?.totalStudents ?? 0} color="blue" />
        <StatCard icon={<Building2 size={24} />} label="Buildings" value={summary?.totalBuildings ?? 0} color="green" />
        <StatCard icon={<DoorOpen size={24} />} label="Rooms" value={summary?.totalRooms ?? 0} color="purple" />
        <StatCard icon={<Bed size={24} />} label="Beds" value={`${summary?.occupiedBeds ?? 0} / ${summary?.totalBeds ?? 0}`} color="orange" subtext={`${summary?.occupancyRate ?? 0}% occupied`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<TrendingUp size={24} />} label="Occupancy Rate" value={`${summary?.occupancyRate ?? 0}%`} color="teal" />
        <StatCard icon={<Wrench size={24} />} label="Pending Repairs" value={summary?.pendingRepairs ?? 0} color="red" />
        <StatCard icon={<Wrench size={24} />} label="In Progress Repairs" value={summary?.inProgressRepairs ?? 0} color="yellow" />
        <StatCard icon={<Bed size={24} />} label="Available Beds" value={summary?.availableBeds ?? 0} color="green" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Occupancy by Building */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Occupancy by Building</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyByBuilding}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="occupied" name="Occupied" fill="#3b82f6" />
              <Bar dataKey="available" name="Available" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Repairs by Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Repair Requests by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={repairsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, count }) => `${status}: ${count}`}
              >
                {repairsByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students by Major */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Students by Major (Top 8)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentsByMajor.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="major" type="category" width={120} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderDist}
                dataKey="count"
                nameKey="gender"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ gender, count }) => `${gender}: ${count}`}
              >
                {genderDist.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#ec4899'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Students by Year */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold">Students by Enrollment Year</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={studentsByYear}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function StatCard({ icon, label, value, color, subtext }: { icon: React.ReactNode; label: string; value: string | number; color: string; subtext?: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      </div>
    </div>
  )
}
