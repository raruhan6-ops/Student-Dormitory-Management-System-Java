"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Home, Wrench, Edit, BedDouble } from 'lucide-react'
import Link from 'next/link'

type Student = {
  studentID: string
  name: string
  gender: string
  major: string
  studentClass: string
  phone: string
  enrollmentYear: number
  dormBuilding?: string
  roomNumber?: string
  bedNumber?: string
  email?: string
}

type RepairRequest = {
  repairID: number
  roomID: number
  description: string
  submitTime: string
  status: string
  handler?: string
  finishTime?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [repairs, setRepairs] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [needsProfile, setNeedsProfile] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Get current user info from backend (includes relatedStudentID)
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) {
          router.push('/auth')
          return
        }
        
        const userInfo = await meRes.json()
        setUserRole(userInfo.role)
        setUsername(userInfo.username)
        
        // If student role but no relatedStudentID, they need to create profile
        if (userInfo.role === 'Student' && !userInfo.relatedStudentID) {
          setNeedsProfile(true)
          setLoading(false)
          return
        }
        
        // Non-students shouldn't see this page
        if (userInfo.role !== 'Student') {
          setLoading(false)
          return
        }

        // Fetch student by relatedStudentID
        const studentRes = await fetch(`/api/students/${userInfo.relatedStudentID}`)
        if (studentRes.ok) {
          const studentData = await studentRes.json()
          if (studentData) {
            setStudent(studentData)
            // Fetch repairs for this student
            const repairsRes = await fetch(`/api/repairs/student/${studentData.studentID}`)
            if (repairsRes.ok) {
              setRepairs(await repairsRes.json())
            }
          } else {
            setNeedsProfile(true)
          }
        } else {
          setNeedsProfile(true)
        }
      } catch (e) {
        // Error loading
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <section className="container-section"><p>Loading…</p></section>
  
  // Non-student message
  if (userRole && userRole !== 'Student') {
    return (
      <section className="container-section">
        <div className="mx-auto max-w-md text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">Staff Account</h2>
          <p className="mt-2 text-gray-500">
            Logged in as <strong>{username}</strong> ({userRole})
          </p>
          <p className="mt-1 text-sm text-gray-500">
            This page is for student accounts only.
          </p>
        </div>
      </section>
    )
  }
  
  // Needs to create profile
  if (needsProfile) {
    return (
      <section className="container-section">
        <div className="mx-auto max-w-md rounded-lg border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-900/20">
          <User className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-4 text-xl font-semibold">Welcome!</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please create your student profile to get started.
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

  if (!student) return <section className="container-section"><p>No profile data available.</p></section>

  return (
    <section className="container-section">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Profile</h2>
        <Link
          href="/profile/setup"
          className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <Edit size={14} /> Edit Profile
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><User size={18} /> Personal Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <dt className="text-sm text-gray-500">Student ID</dt>
              <dd className="text-sm font-medium">{student.studentID}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-sm font-medium">{student.name}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <dt className="text-sm text-gray-500">Gender</dt>
              <dd className="text-sm font-medium">{student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : student.gender}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <dt className="text-sm text-gray-500">Major</dt>
              <dd className="text-sm font-medium">{student.major}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <dt className="text-sm text-gray-500">Class</dt>
              <dd className="text-sm font-medium">{student.studentClass}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="text-sm font-medium">{student.phone || '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-sm font-medium">{student.email || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Enrollment Year</dt>
              <dd className="text-sm font-medium">{student.enrollmentYear}</dd>
            </div>
          </dl>
        </div>

        {/* Dorm Assignment */}
        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Home size={18} /> Current Dorm Assignment</h3>
          {student.dormBuilding && student.roomNumber && student.bedNumber ? (
            <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-lg font-semibold text-green-700 dark:text-green-400">{student.dormBuilding}</p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-500">Room {student.roomNumber} • Bed {student.bedNumber}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">No dorm assigned yet.</p>
              </div>
              <Link
                href="/apply-room"
                className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <BedDouble size={16} /> Apply for a Room
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Repair Requests */}
      <div className="mt-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700">
        <h3 className="mb-4 flex items-center gap-2 font-semibold"><Wrench size={18} /> My Repair Requests</h3>
        {repairs.length === 0 ? (
          <p className="text-sm text-gray-500">No repair requests submitted.</p>
        ) : (
          <div className="space-y-3">
            {repairs.map((r) => (
              <div key={r.repairID} className="rounded-md border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Room #{r.roomID}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${r.status === 'Finished' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : r.status === 'InProgress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{r.description}</p>
                <p className="mt-1 text-xs text-gray-500">Submitted: {new Date(r.submitTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
