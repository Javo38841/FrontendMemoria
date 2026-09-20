import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthProvider'
import { ProtectedRoute } from '../../../router/ProtectedRoute'
import { api, setAuthToken } from '../../../services/api.config'
import { LogoutButton } from './LogoutButton'

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/events']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>pantalla de login</p>} />
          <Route path="/events" element={<ProtectedRoute><LogoutButton /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LogoutButton', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'jwt-abc')
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'tomas' }))
    setAuthToken('jwt-abc')
  })

  it('cierra la sesión: limpia el almacenamiento, quita el header y vuelve a /login', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar Sesión' }))

    expect(await screen.findByText('pantalla de login')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(api.defaults.headers.common['Authorization']).toBeUndefined()
  })

  it('tras cerrar sesión no se puede volver a la ruta protegida', async () => {
    renderApp()
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar Sesión' }))
    await waitFor(() => expect(screen.getByText('pantalla de login')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Cerrar Sesión' })).not.toBeInTheDocument()
  })
})
