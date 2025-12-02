"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, DoorOpen, BedDouble, Check, AlertCircle } from 'lucide-react'

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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if user has a profile
        const profileRes = await fetch('/api/student-portal/profile')
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (!profile) {
            setHasProfile(false)
            setLoading(false)
            return
          }
          setHasProfile(true)
          
          // Check if already has a room
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

        // Load available rooms
        const roomsRes = await fetch('/api/student-portal/available-rooms')
        if (roomsRes.ok) {
          const data = await roomsRes.json()
          setBuildings(data)
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Failed to load data' })
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
        throw new Error(typeof data === 'string' ? data : data.message || 'Application failed')
      }

      setMessage({ 
        type: 'success', 
        text: `🎉 Room assigned successfully! You are now in ${data.building} - Room ${data.room}, Bed ${data.bed}` 
      })
      
      // Redirect to profile after delay
      setTimeout(() => {
        router.push('/profile')
      }, 2500)
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to apply for room' })
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <section className="container-section">
        <p>Loading available rooms...</p>
      </section>
    )
  }

  if (hasProfile === false) {
    return (
      <section className="container-section">
        <div className="mx-auto max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-4 text-xl font-semibold">Profile Required</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You need to create your student profile before applying for a room.
          </p>
          <button
            onClick={() => router.push('/profile/setup')}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create Profile
          </button>
        </div>
      </section>
    )
  }

  if (hasRoom) {
    return (
      <section className="container-section">
        <div className="mx-auto max-w-md rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
          <Check className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-xl font-semibold">Room Already Assigned</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You already have a room assigned. Check your profile for details.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            View Profile
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="container-section">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Apply for a Room</h2>
        <p className="text-gray-500">Select an available bed from the list below</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-md p-4 ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {buildings.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center dark:border-gray-700">
          <DoorOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 font-semibold">No Rooms Available</h3>
          <p className="mt-2 text-sm text-gray-500">
            There are currently no available beds. Please check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {buildings.map((building) => (
            <div key={building.buildingID} className="rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600" />
                  <h3 className="font-semibold">{building.buildingName}</h3>
                  <span className="text-sm text-gray-500">- {building.location}</span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {building.rooms.map((room) => (
                    <div
                      key={room.roomID}
                      className="rounded-md border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DoorOpen size={16} className="text-gray-500" />
                          <span className="font-medium">Room {room.roomNumber}</span>
                        </div>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {room.roomType}
                        </span>
                      </div>
                      
                      <p className="mb-3 text-sm text-gray-500">
                        {room.availableSpots} of {room.capacity} beds available
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {room.availableBeds.map((bed) => (
                          <button
                            key={bed.bedID}
                            onClick={() => handleSelectBed(building, room, bed.bedID)}
                            className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                              selectedBed === bed.bedID
                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            <BedDouble size={14} />
                            Bed {bed.bedNumber}
                            {selectedBed === bed.bedID && <Check size={14} className="ml-1" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selection summary and apply button */}
      {selectedBed && selectedRoom && selectedBuilding && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h4 className="font-semibold">Your Selection</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {selectedBuilding.buildingName} → Room {selectedRoom.roomNumber} → Bed {
              selectedRoom.availableBeds.find(b => b.bedID === selectedBed)?.bedNumber
            }
          </p>
          <button
            onClick={handleApply}
            disabled={applying}
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {applying ? 'Applying...' : 'Confirm Application'}
          </button>
        </div>
      )}
    </section>
  )
}
