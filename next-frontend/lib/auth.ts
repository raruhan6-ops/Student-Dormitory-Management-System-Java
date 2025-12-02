import crypto from 'crypto'

export type AuthPayload = { username: string; role: string; exp: number }

function base64UrlDecode(input: string): Buffer {
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) input += '='.repeat(4 - pad)
  return Buffer.from(input, 'base64')
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function verifyAndDecodeToken(token: string | undefined | null, secret: string): AuthPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts
  try {
    const h = crypto.createHmac('sha256', secret)
    h.update(Buffer.from(payloadB64, 'utf8'))
    const expected = base64UrlEncode(h.digest())
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigB64))) return null
    const payloadBuf = base64UrlDecode(payloadB64)
    const json = JSON.parse(payloadBuf.toString('utf8')) as AuthPayload
    if (!json || !json.username || !json.role || !json.exp) return null
    if (Date.now() / 1000 > json.exp) return null
    return json
  } catch {
    return null
  }
}
