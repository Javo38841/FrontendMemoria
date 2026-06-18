import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../features/auth/hooks/useAuth')

import { useAuth } from '../features/auth/hooks/useAuth'

const mockUseAuth = vi.mocked(useAuth)

function renderWithRouter(ui: React.ReactNode, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('shows loading indicator while auth is being checked', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ProtectedRoute><p>contenido</p></ProtectedRoute>)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(screen.queryByText('contenido')).not.toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute><p>contenido protegido</p></ProtectedRoute>
    )
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, username: 'tomas' },
      token: 'token123',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(<ProtectedRoute><p>contenido protegido</p></ProtectedRoute>)
    expect(screen.getByText('contenido protegido')).toBeInTheDocument()
  })
})
