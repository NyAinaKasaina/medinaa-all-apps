import { api } from '../src/lib/api'

global.fetch = jest.fn()

beforeEach(() => jest.clearAllMocks())

describe('api.places.list', () => {
  it('builds query string from params', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, text: async () => JSON.stringify({ items: [], total: 0, page: 1, limit: 20, pages: 0 })
    })
    await api.places.list({ q: 'hopital', type: 'hospital', page: 2 })
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(url).toContain('q=hopital')
    expect(url).toContain('type=hospital')
    expect(url).toContain('page=2')
  })
})

describe('api.auth.login', () => {
  it('sends email and password in body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, text: async () => JSON.stringify({ token: 'jwt', user: { id: '1', email: 'a@b.com' } })
    })
    await api.auth.login('a@b.com', 'pass')
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body).toEqual({ email: 'a@b.com', password: 'pass' })
  })

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' })
    await expect(api.auth.login('a@b.com', 'wrong')).rejects.toThrow('401')
  })
})
