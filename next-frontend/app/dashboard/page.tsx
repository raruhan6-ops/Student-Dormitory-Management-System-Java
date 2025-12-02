"use client"

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts'
import { Users, Building2, DoorOpen, Bed, Wrench, TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'

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

const CHART_COLORS = {
  primary: '#1e40af',
  secondary: '#10b981',
  tertiary: '#f59e0b',
  quaternary: '#ef4444',
  accent1: '#8b5cf6',
  accent2: '#ec4899',
  accent3: '#06b6d4',
  accent4: '#84cc16',
}

const PIE_COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [occupancyByBuilding, setOccupancyByBuilding] = useState<OccupancyByBuilding[]>([])
  const [repairsByStatus, setRepairsByStatus] = useState<RepairsByStatus[]>([])
  const [studentsByMajor, setStudentsByMajor] = useState<StudentsByMajor[]>([])
  const [studentsByYear, setStudentsByYear] = useState<StudentsByYear[]>([])
  const [genderDist, setGenderDist] = useState<GenderDist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
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
      setLastUpdated(new Date())
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-section">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Failed to load dashboard</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{error}</p>
          <button onClick={load} className="btn-primary mt-4">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-section space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description mt-1">
            Overview of your dormitory management system
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          icon={<Users className="h-6 w-6" />} 
          label="Total Students" 
          value={summary?.totalStudents ?? 0} 
          color="blue"
          trend="+12% from last month"
        />
        <StatCard 
          icon={<Building2 className="h-6 w-6" />} 
          label="Buildings" 
          value={summary?.totalBuildings ?? 0} 
          color="emerald"
        />
        <StatCard 
          icon={<DoorOpen className="h-6 w-6" />} 
          label="Total Rooms" 
          value={summary?.totalRooms ?? 0} 
          color="purple"
        />
        <StatCard 
          icon={<Bed className="h-6 w-6" />} 
          label="Bed Occupancy" 
          value={`${summary?.occupiedBeds ?? 0} / ${summary?.totalBeds ?? 0}`} 
          color="amber"
          subtext={`${summary?.occupancyRate ?? 0}% occupied`}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4">
          <div className="stat-icon bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-label">Available Beds</p>
            <p className="stat-value text-emerald-600 dark:text-emerald-400">{summary?.availableBeds ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="stat-icon bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-label">Pending Repairs</p>
            <p className="stat-value text-amber-600 dark:text-amber-400">{summary?.pendingRepairs ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="stat-icon bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-label">In Progress</p>
            <p className="stat-value text-blue-600 dark:text-blue-400">{summary?.inProgressRepairs ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="stat-icon bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="stat-label">Occupancy Rate</p>
            <p className="stat-value text-primary-600 dark:text-primary-400">{summary?.occupancyRate ?? 0}%</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Occupancy by Building */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Occupancy by Building</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={occupancyByBuilding} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
              <Bar dataKey="occupied" name="Occupied" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="available" name="Available" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Repairs by Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Repair Requests by Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={repairsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {repairsByStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students by Major */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Students by Major (Top 8)</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={studentsByMajor.slice(0, 8)} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="major" type="category" fontSize={11} tickLine={false} axisLine={false} width={75} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Bar dataKey="count" fill={CHART_COLORS.accent1} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gender Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={genderDist}
                dataKey="count"
                nameKey="gender"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {genderDist.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.gender === 'M' || entry.gender === 'Male' ? CHART_COLORS.primary : CHART_COLORS.accent2} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Students by Year - Full Width */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Students by Enrollment Year</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={studentsByYear} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={CHART_COLORS.primary} 
              strokeWidth={2}
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  subtext,
  trend 
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  subtext?: string
  trend?: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className="badge-success text-xs">
            <TrendingUp className="mr-1 h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="stat-label">{label}</p>
        <p className="stat-value mt-1">{value}</p>
        {subtext && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtext}</p>}
      </div>
    </div>
  )
}
