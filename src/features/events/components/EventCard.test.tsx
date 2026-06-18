import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EventCard } from './EventCard'
import type { Event } from '../types/events.types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockEvent: Event = {
  id: 7,
  title: 'Evento de prueba',
  description: 'Una descripción cualquiera',
  date: '2099-12-01',
  location: 'Santiago, Chile',
}

function renderCard(props: Partial<React.ComponentProps<typeof EventCard>> = {}) {
  return render(
    <MemoryRouter>
      <EventCard event={mockEvent} {...props} />
    </MemoryRouter>
  )
}

describe('EventCard — renderizado', () => {
  it('renders title, description, location, and date', () => {
    renderCard()
    expect(screen.getByText('Evento de prueba')).toBeInTheDocument()
    expect(screen.getByText('Una descripción cualquiera')).toBeInTheDocument()
    expect(screen.getByText(/Santiago, Chile/)).toBeInTheDocument()
    expect(screen.getByText(/2099-12-01/)).toBeInTheDocument()
  })

  it('does not show action buttons when showActions is false', () => {
    renderCard({ showActions: false })
    expect(screen.queryByText(/Editar/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Eliminar/)).not.toBeInTheDocument()
  })

  it('shows edit and delete buttons when showActions is true', () => {
    renderCard({ showActions: true, onEdit: vi.fn(), onDelete: vi.fn() })
    expect(screen.getByText(/Editar/)).toBeInTheDocument()
    expect(screen.getByText(/Eliminar/)).toBeInTheDocument()
  })

  it('shows time range when startTime and endTime are provided', () => {
    renderCard({ event: { ...mockEvent, startTime: '10:00', endTime: '12:00' } })
    expect(screen.getByText(/10:00 - 12:00/)).toBeInTheDocument()
  })
})

describe('EventCard — interacciones', () => {
  it('navigates to event detail on card click', () => {
    renderCard()
    fireEvent.click(screen.getByText('Evento de prueba'))
    expect(mockNavigate).toHaveBeenCalledWith('/events/7')
  })

  it('calls onEdit with the event when Editar is clicked', () => {
    const onEdit = vi.fn()
    renderCard({ showActions: true, onEdit })
    fireEvent.click(screen.getByText(/Editar/))
    expect(onEdit).toHaveBeenCalledWith(mockEvent)
  })

  it('calls onDelete with event id when Eliminar is clicked', () => {
    const onDelete = vi.fn()
    renderCard({ showActions: true, onDelete })
    fireEvent.click(screen.getByText(/Eliminar/))
    expect(onDelete).toHaveBeenCalledWith(7)
  })

  it('does not navigate when action buttons are clicked', () => {
    mockNavigate.mockClear()
    const onEdit = vi.fn()
    renderCard({ showActions: true, onEdit })
    fireEvent.click(screen.getByText(/Editar/))
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
