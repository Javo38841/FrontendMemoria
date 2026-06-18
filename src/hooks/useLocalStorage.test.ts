import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

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
  vi.stubGlobal('window', { localStorage: (globalThis as any).localStorage })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLocalStorage', () => {
  it('returns initial value when key is not set', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('reads existing value from localStorage on mount', () => {
    localStorage.setItem('key', JSON.stringify('persisted'))
    const { result } = renderHook(() => useLocalStorage('key', 'default'))
    expect(result.current[0]).toBe('persisted')
  })

  it('stores the new value in localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('key', ''))
    act(() => result.current[1]('nuevo valor'))
    expect(localStorage.getItem('key')).toBe(JSON.stringify('nuevo valor'))
  })

  it('updates state when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('key', 0))
    act(() => result.current[1](42))
    expect(result.current[0]).toBe(42)
  })

  it('supports updater function', () => {
    const { result } = renderHook(() => useLocalStorage('key', 10))
    act(() => result.current[1]((prev) => prev + 5))
    expect(result.current[0]).toBe(15)
  })

  it('works with objects', () => {
    const { result } = renderHook(() => useLocalStorage<{ name: string } | null>('key', null))
    act(() => result.current[1]({ name: 'tomas' }))
    expect(result.current[0]).toEqual({ name: 'tomas' })
  })

  it('falls back to initial value when stored JSON is corrupted', () => {
    localStorage.setItem('key', 'not-valid-json{{{')
    const { result } = renderHook(() => useLocalStorage('key', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })
})
