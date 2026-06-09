import AsyncStorage from '@react-native-async-storage/async-storage'
import { storage } from '../src/lib/storage'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

beforeEach(async () => { await (AsyncStorage as any).clear() })

describe('storage.recentlyViewed', () => {
  it('adds and deduplicates ids', async () => {
    await storage.addRecentlyViewed('a')
    await storage.addRecentlyViewed('b')
    await storage.addRecentlyViewed('a')
    const result = await storage.getRecentlyViewed()
    expect(result).toEqual(['a', 'b'])
  })

  it('caps at 10 items', async () => {
    for (let i = 0; i < 12; i++) await storage.addRecentlyViewed(String(i))
    const result = await storage.getRecentlyViewed()
    expect(result.length).toBe(10)
  })
})

describe('storage.language', () => {
  it('stores and retrieves language', async () => {
    await storage.setLanguage('mg')
    expect(await storage.getLanguage()).toBe('mg')
  })
})
