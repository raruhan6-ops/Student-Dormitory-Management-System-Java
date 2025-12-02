import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // Clear HttpOnly auth cookie set by backend
  res.cookies.set({ name: 'auth', value: '', path: '/', httpOnly: true, sameSite: 'lax', maxAge: 0 })
  return res
}
