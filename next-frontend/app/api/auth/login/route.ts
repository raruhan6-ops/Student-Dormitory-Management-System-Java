import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  // Forward to backend
  const backendRes = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await backendRes.text()

  // Build response
  const res = new NextResponse(text, {
    status: backendRes.status,
    headers: { 'Content-Type': backendRes.headers.get('Content-Type') || 'application/json' },
  })

  // Forward Set-Cookie from backend to browser
  const setCookie = backendRes.headers.get('set-cookie')
  if (setCookie) {
    res.headers.set('Set-Cookie', setCookie)
  }

  return res
}
