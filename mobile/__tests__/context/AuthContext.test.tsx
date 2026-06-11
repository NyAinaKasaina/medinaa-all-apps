import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { storage } from '@/lib/storage'

jest.mock('@/lib/api')
jest.mock('@/lib/storage', () => ({
  storage: { getToken: jest.fn().mockResolvedValue(null), setToken: jest.fn(), clearToken: jest.fn() }
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>

beforeEach(() => {
  jest.clearAllMocks()
  ;(storage.getToken as jest.Mock).mockResolvedValue(null)
})

it('starts with no token', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => {})
  expect(result.current.token).toBeNull()
})

it('sets token after login', async () => {
  ;(api.auth.login as jest.Mock).mockResolvedValue({ token: 'jwt123', user: { id: '1', email: 'a@b.com' } })
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => { await result.current.login('a@b.com', 'pass') })
  expect(result.current.token).toBe('jwt123')
  expect(storage.setToken).toHaveBeenCalledWith('jwt123')
})

it('clears token on logout', async () => {
  ;(api.auth.login as jest.Mock).mockResolvedValue({ token: 'jwt123', user: { id: '1', email: 'a@b.com' } })
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => { await result.current.login('a@b.com', 'pass') })
  await act(async () => { await result.current.logout() })
  expect(result.current.token).toBeNull()
})

it('does not set token on failed login', async () => {
  ;(api.auth.login as jest.Mock).mockRejectedValue(new Error('401: Unauthorized'))
  const { result } = renderHook(() => useAuth(), { wrapper })
  await act(async () => {
    await expect(result.current.login('a@b.com', 'wrong')).rejects.toThrow('401')
  })
  expect(result.current.token).toBeNull()
  expect(storage.setToken).not.toHaveBeenCalled()
})
