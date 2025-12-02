import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function b64urlToArrayBuffer(b64url: string): ArrayBuffer {
  const pad = b64url.length % 4
  const b64 = (pad ? b64url + '='.repeat(4 - pad) : b64url).replace(/-/g, '+').replace(/_/g, '/')
  const str = atob(b64)
  const buf = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i)
  return buf.buffer
}

async function verifyTokenEdge(token: string, secret: string): Promise<{ role: string } | null> {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64))
    const expected = new Uint8Array(signature)
    const provided = new Uint8Array(b64urlToArrayBuffer(sigB64))
    if (expected.length !== provided.length) return null
    let ok = 0
    for (let i = 0; i < expected.length; i++) ok |= expected[i] ^ provided[i]
    if (ok !== 0) return null
    const decoded = new TextDecoder().decode(b64urlToArrayBuffer(payloadB64))
    const payload = JSON.parse(decoded) as { username?: string; role?: string; exp?: number }
    if (!payload || !payload.role || !payload.exp) return null
    if (Math.floor(Date.now() / 1000) > Number(payload.exp)) return null
    return { role: String(payload.role) }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth')?.value
    const secret = process.env.AUTH_SECRET || 'change-me'
    if (!token) return NextResponse.redirect(new URL('/auth', req.url))
    const verified = await verifyTokenEdge(token, secret)
    const role = verified?.role
    if (!role || (role !== 'Admin' && role !== 'DormManager' && role !== 'Student')) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
