import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventsService } from './events.services'

vi.mock('../../../services/api.config', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '../../../services/api.config'
const mockApi = vi.mocked(api)

const mockEvent = {
  id: 1,
  title: 'Evento test',
  description: 'Descripción',
  date: '2099-12-01',
  location: 'Santiago',
  latitude: -33.4,
  longitude: -70.6,
}

const mockEventRequest = {
  title: 'Evento test',
  description: 'Descripción',
  date: '2099-12-01',
  location: 'Santiago',
  latitude: -33.4,
  longitude: -70.6,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('eventsService.getAll', () => {
  it('fetches from /events/allEvents', async () => {
    mockApi.get.mockResolvedValue({ data: [mockEvent] })

    const result = await eventsService.getAll()

    expect(mockApi.get).toHaveBeenCalledWith('/events/allEvents')
    expect(result).toEqual([mockEvent])
  })
})

describe('eventsService.getMyEvents', () => {
  it('fetches from /events/my-events with userId param', async () => {
    mockApi.get.mockResolvedValue({ data: [mockEvent] })

    await eventsService.getMyEvents(42)

    expect(mockApi.get).toHaveBeenCalledWith('/events/my-events', { params: { userId: 42 } })
  })
})

describe('eventsService.getById', () => {
  it('fetches from /events/:id', async () => {
    mockApi.get.mockResolvedValue({ data: mockEvent })

    const result = await eventsService.getById(1)

    expect(mockApi.get).toHaveBeenCalledWith('/events/1')
    expect(result).toEqual(mockEvent)
  })
})

describe('eventsService.create', () => {
  it('posts to /events with userId param', async () => {
    mockApi.post.mockResolvedValue({ data: mockEvent })

    const result = await eventsService.create(5, mockEventRequest)

    expect(mockApi.post).toHaveBeenCalledWith('/events', mockEventRequest, { params: { userId: 5 } })
    expect(result).toEqual(mockEvent)
  })
})

describe('eventsService.update', () => {
  it('puts to /events/:id with userId param', async () => {
    const updated = { ...mockEvent, title: 'Actualizado' }
    mockApi.put.mockResolvedValue({ data: updated })

    const result = await eventsService.update(1, 5, { ...mockEventRequest, title: 'Actualizado' })

    expect(mockApi.put).toHaveBeenCalledWith(
      '/events/1',
      { ...mockEventRequest, title: 'Actualizado' },
      { params: { userId: 5 } }
    )
    expect(result).toEqual(updated)
  })
})

describe('eventsService.delete', () => {
  it('deletes /events/:id with userId param', async () => {
    mockApi.delete.mockResolvedValue({ data: undefined })

    await eventsService.delete(1, 5)

    expect(mockApi.delete).toHaveBeenCalledWith('/events/1', { params: { userId: 5 } })
  })
})
