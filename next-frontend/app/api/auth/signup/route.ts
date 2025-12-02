import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { username, password, role } = body as { username?: string; password?: string; role?: string }

  if (!username || !password) {
    return NextResponse.json({ ok: false, message: 'Missing fields' }, { status: 400 })
  }

  // Mock signup: echo created user
  return NextResponse.json({ ok: true, user: { username, role: role ?? 'student' } })
}
