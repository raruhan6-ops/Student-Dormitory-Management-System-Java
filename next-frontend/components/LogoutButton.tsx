"use client"

export default function LogoutButton() {
  const onLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    } finally {
      window.location.href = '/auth'
    }
  }
  return (
    <button
      onClick={onLogout}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      Logout
    </button>
  )
}
