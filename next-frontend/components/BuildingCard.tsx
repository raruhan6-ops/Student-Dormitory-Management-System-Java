"use client"

import { motion } from 'framer-motion'
import { MapPin, Users, Bed, ArrowRight } from 'lucide-react'
import Image from 'next/image'

interface BuildingProps {
  buildingID: number
  buildingName: string
  location: string
  totalCapacity: number
  availableBeds: number
  description: string
  imageUrl: string
}

export default function BuildingCard({ building }: { building: BuildingProps }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={building.imageUrl}
          alt={building.buildingName}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold">{building.buildingName}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-200">
            <MapPin className="h-3 w-3" />
            <span>{building.location}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
          {building.description}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">总容量</p>
              <p className="font-semibold text-gray-900 dark:text-white">{building.totalCapacity}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
            <Bed className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">可用床位</p>
              <p className="font-semibold text-gray-900 dark:text-white">{building.availableBeds}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 dark:bg-gray-700 dark:hover:bg-primary-600">
            查看详情
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
