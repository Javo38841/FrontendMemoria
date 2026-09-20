import { describe, it, expect } from 'vitest'
import { isTokenExpired } from './jwt'

// Arma un JWT sin firma real: header.payload.firma con el payload en base64url (UTF-8)
const makeToken = (payload: Record<string, unknown>): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const base64 = btoa(String.fromCharCode(...bytes))
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${base64url}.firma`
}

const NOW_MS = Date.UTC(2026, 8, 20, 12, 0, 0)
const NOW_S = NOW_MS / 1000

describe('isTokenExpired', () => {
  it('es true cuando exp ya pasó', () => {
    expect(isTokenExpired(makeToken({ exp: NOW_S - 60 }), NOW_MS)).toBe(true)
  })

  it('es false cuando exp es futuro', () => {
    expect(isTokenExpired(makeToken({ exp: NOW_S + 3600 }), NOW_MS)).toBe(false)
  })

  it('es false si el token no trae exp o no se puede leer', () => {
    expect(isTokenExpired(makeToken({ sub: 'tomas' }), NOW_MS)).toBe(false)
    expect(isTokenExpired('jwt-abc', NOW_MS)).toBe(false)
    expect(isTokenExpired('a.%%%.c', NOW_MS)).toBe(false)
    expect(isTokenExpired('', NOW_MS)).toBe(false)
  })

  it('lee correctamente un payload con tildes (UTF-8)', () => {
    expect(isTokenExpired(makeToken({ sub: 'José Ñandú', exp: NOW_S - 1 }), NOW_MS)).toBe(true)
    expect(isTokenExpired(makeToken({ sub: 'José Ñandú', exp: NOW_S + 1 }), NOW_MS)).toBe(false)
  })
})
