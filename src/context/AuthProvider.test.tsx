import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider } from './AuthProvider'
import { AuthContext } from './AuthContext'
import { useContext, useState } from 'react'

vi.mock('../features/auth/services/auth.services')
vi.mock('../services/storage.service')
vi.mock('../services/api.config')

import { authService } from '../features/auth/services/auth.services'
import { storageService } from '../services/storage.service'
import { setAuthToken } from '../services/api.config'

const mockAuthService = vi.mocked(authService)
const mockStorageService = vi.mocked(storageService)
const mockSetAuthToken = vi.mocked(setAuthToken)

function AuthConsumer() {
  const ctx = useContext(AuthContext)!
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try { await ctx.login({ username: 'tomas', password: '1234' }) }
    catch (e) { setError((e as Error).message) }
  }

  const handleRegister = async () => {
    try { await ctx.register({ username: 'tomas', email: 'a@b.com', password: '1234' }) }
    catch (e) { setError((e as Error).message) }
  }

  return (
    <div>
      <span data-testid="user">{ctx.user?.username ?? 'none'}</span>
      <span data-testid="token">{ctx.token ?? 'none'}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      {error && <span data-testid="error">{error}</span>}
      <button onClick={handleLogin}>login</button>
      <button onClick={handleRegister}>register</button>
      <button onClick={ctx.logout}>logout</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStorageService.getToken.mockReturnValue(null)
  mockStorageService.getUser.mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AuthProvider — inicialización', () => {
  it('starts with isLoading true and resolves to false', async () => {
    renderProvider()
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })

  it('restores session from localStorage on mount', async () => {
    mockStorageService.getToken.mockReturnValue('saved-token')
    mockStorageService.getUser.mockReturnValue({ id: 2, username: 'tomas' })

    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('tomas')
      expect(screen.getByTestId('token').textContent).toBe('saved-token')
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })
    expect(mockSetAuthToken).toHaveBeenCalledWith('saved-token')
  })

  it('stays unauthenticated when localStorage is empty', async () => {
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('none')
  })
})

describe('AuthProvider — login', () => {
  it('sets user and token after successful login', async () => {
    mockAuthService.login.mockResolvedValue({ token: 'jwt-abc', id: 1, username: 'tomas' })

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await act(async () => {
      screen.getByText('login').click()
    })

    expect(screen.getByTestId('user').textContent).toBe('tomas')
    expect(screen.getByTestId('token').textContent).toBe('jwt-abc')
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
  })

  it('persists token and user to localStorage', async () => {
    mockAuthService.login.mockResolvedValue({ token: 'jwt-abc', id: 1, username: 'tomas' })

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await act(async () => { screen.getByText('login').click() })

    expect(mockStorageService.setToken).toHaveBeenCalledWith('jwt-abc')
    expect(mockStorageService.setUser).toHaveBeenCalledWith({ id: 1, username: 'tomas' })
    expect(mockSetAuthToken).toHaveBeenCalledWith('jwt-abc')
  })

  it('exposes error when login fails', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Credenciales inválidas'))

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await act(async () => { screen.getByText('login').click() })

    expect(screen.getByTestId('error').textContent).toBe('Credenciales inválidas')
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
  })
})

describe('AuthProvider — logout', () => {
  it('clears user, token, and localStorage', async () => {
    mockAuthService.login.mockResolvedValue({ token: 'jwt-abc', id: 1, username: 'tomas' })

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await act(async () => { screen.getByText('login').click() })
    await act(async () => { screen.getByText('logout').click() })

    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(screen.getByTestId('token').textContent).toBe('none')
    expect(mockStorageService.clearAuth).toHaveBeenCalled()
    expect(mockSetAuthToken).toHaveBeenCalledWith(null)
  })
})

describe('AuthProvider — register', () => {
  it('registers and auto-logs in', async () => {
    mockAuthService.register.mockResolvedValue(undefined)
    mockAuthService.login.mockResolvedValue({ token: 'jwt-new', id: 3, username: 'tomas' })

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await act(async () => { screen.getByText('register').click() })

    expect(mockAuthService.register).toHaveBeenCalledOnce()
    expect(mockAuthService.login).toHaveBeenCalledOnce()
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
  })

  it('exposes error when registration fails', async () => {
    mockAuthService.register.mockRejectedValue(new Error('Username taken'))

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await act(async () => { screen.getByText('register').click() })

    expect(screen.getByTestId('error').textContent).toBe('Username taken')
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
  })
})
