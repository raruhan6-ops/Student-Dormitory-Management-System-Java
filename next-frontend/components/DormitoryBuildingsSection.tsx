"use client"

import { useEffect, useState } from 'react'
import BuildingCard from './BuildingCard'
import { Building2, Loader2 } from 'lucide-react'

interface Building {
  buildingID: number
  buildingName: string
  location: string
  totalCapacity: number
  availableBeds: number
  description: string
  imageUrl: string
}

export default function DormitoryBuildingsSection() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await fetch('/api/student-portal/buildings/summary')
        if (!res.ok) throw new Error('Failed to fetch buildings')
        const data = await res.json()
        setBuildings(data)
      } catch (err) {
        setError('无法加载宿舍信息')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBuildings()
  }, [])

  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            宿舍楼栋概览
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            探索我们为您提供的舒适、现代化的住宿环境，助力您的学业成功。
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {buildings.map((building) => (
              <BuildingCard key={building.buildingID} building={building} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
