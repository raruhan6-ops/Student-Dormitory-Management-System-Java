import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { cookies } from 'next/headers'
import LogoutButton from './LogoutButton'
import { verifyAndDecodeToken } from '@/lib/auth'

export default function Navbar() {
  const raw = cookies().get('auth')?.value
  const secret = process.env.AUTH_SECRET || 'change-me'
  const payload = verifyAndDecodeToken(raw, secret)
  const username = payload?.username ?? null
  const role = payload?.role ?? null

  const isAdmin = role === 'Admin'
  const isManager = role === 'DormManager'
  const isStudent = role === 'Student'
  const isStaff = isAdmin || isManager

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Dormitory
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {username && (
            <>
              {isStaff && <Link href="/dashboard" className="text-gray-600 hover:underline dark:text-gray-300">Dashboard</Link>}
              {isStaff && <Link href="/students" className="text-gray-600 hover:underline dark:text-gray-300">Students</Link>}
              {isStaff && <Link href="/buildings" className="text-gray-600 hover:underline dark:text-gray-300">Buildings</Link>}
              {isStaff && <Link href="/checkin" className="text-gray-600 hover:underline dark:text-gray-300">Check-In</Link>}
              {isStaff && <Link href="/batch" className="text-gray-600 hover:underline dark:text-gray-300">Batch</Link>}
              <Link href="/repairs" className="text-gray-600 hover:underline dark:text-gray-300">Repairs</Link>
              {isAdmin && <Link href="/admin/users" className="text-gray-600 hover:underline dark:text-gray-300">Users</Link>}
              {isAdmin && <Link href="/admin/audit" className="text-gray-600 hover:underline dark:text-gray-300">Audit</Link>}
              {isStudent && <Link href="/profile" className="text-gray-600 hover:underline dark:text-gray-300">Profile</Link>}
              {isStudent && <Link href="/apply-room" className="text-gray-600 hover:underline dark:text-gray-300">Apply Room</Link>}
            </>
          )}
          {username ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">{username}</span>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/auth" className="text-gray-600 hover:underline dark:text-gray-300">Sign in</Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
