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

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800">
      <div className="container flex h-full items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          Dormitory
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:underline dark:text-gray-300">
            Dashboard
          </Link>
          {username ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600 dark:text-gray-300">{username} {role ? `(${role})` : ''}</span>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/auth" className="text-sm text-gray-600 hover:underline dark:text-gray-300">
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
