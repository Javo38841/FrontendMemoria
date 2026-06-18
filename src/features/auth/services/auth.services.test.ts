import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from './auth.services'

vi.mock('../../../services/api.config', () => ({
  api: {
    post: vi.fn(),
  },
}))

import { api } from '../../../services/api.config'
const mockApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authService.login', () => {
  it('posts to /auth/login and returns response data', async () => {
    const responseData = { token: 'jwt-abc', id: 1, username: 'tomas' }
    mockApi.post.mockResolvedValue({ data: responseData })

    const result = await authService.login({ username: 'tomas', password: '1234' })

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
      username: 'tomas',
      password: '1234',
    })
    expect(result).toEqual(responseData)
  })

  it('propagates API errors', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'))
    await expect(authService.login({ username: 'x', password: 'y' })).rejects.toThrow('Network error')
  })
})

describe('authService.register', () => {
  it('posts to /users with all credentials', async () => {
    mockApi.post.mockResolvedValue({ data: {} })

    await authService.register({ username: 'tomas', email: 'a@b.com', password: '1234' })

    expect(mockApi.post).toHaveBeenCalledWith('/users', {
      username: 'tomas',
      email: 'a@b.com',
      password: '1234',
    })
  })

  it('propagates API errors', async () => {
    mockApi.post.mockRejectedValue(new Error('Username taken'))
    await expect(
      authService.register({ username: 'x', email: 'x@x.com', password: 'y' })
    ).rejects.toThrow('Username taken')
  })
})
