import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { storageService } from './storage.service'

function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageMock())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('storageService — token', () => {
  it('returns null when no token is stored', () => {
    expect(storageService.getToken()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    storageService.setToken('abc123')
    expect(storageService.getToken()).toBe('abc123')
  })

  it('removes the token', () => {
    storageService.setToken('abc123')
    storageService.removeToken()
    expect(storageService.getToken()).toBeNull()
  })
})

describe('storageService — user', () => {
  const user = { id: 1, username: 'tomas' }

  it('returns null when no user is stored', () => {
    expect(storageService.getUser()).toBeNull()
  })

  it('stores and retrieves a user', () => {
    storageService.setUser(user)
    expect(storageService.getUser()).toEqual(user)
  })

  it('removes the user', () => {
    storageService.setUser(user)
    storageService.removeUser()
    expect(storageService.getUser()).toBeNull()
  })
})

describe('storageService — clearAuth', () => {
  it('removes both token and user', () => {
    storageService.setToken('abc123')
    storageService.setUser({ id: 1, username: 'tomas' })
    storageService.clearAuth()
    expect(storageService.getToken()).toBeNull()
    expect(storageService.getUser()).toBeNull()
  })
})
