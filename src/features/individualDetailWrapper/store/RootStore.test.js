// store.test.ts
import { getDefaultStore } from 'jotai'
import { describe, expect, it} from 'vitest'
import DefaultLoader from '../../assets/images/loader/RadialPulseLoader.svg'
import {
  AuthStateAtom,
  CaseDataAtom,
  FavoritesAtom,
  LoaderAtom,
  TimezoneAtom
} from './RootStore'
import { DEFAULT_TIMEZONE } from '../../config/Constants'
describe('store atoms', () => {
  const store = getDefaultStore()
  it('should have null as default for AuthStateAtom', () => {
    expect(store.get(AuthStateAtom)).toBeNull()
  })
  it('should have DEFAULT_TIMEZONE as default for TimezoneAtom', () => {
    expect(store.get(TimezoneAtom)).toBe(DEFAULT_TIMEZONE)
  })
  it('should have null as default for FavoritesAtom', () => {
    expect(store.get(FavoritesAtom)).toBeNull()
  })
  it('should have null as default for CaseDataAtom', () => {
    expect(store.get(CaseDataAtom)).toBeNull()
  })
  it('should have DefaultLoader as default for LoaderAtom', () => {
    expect(store.get(LoaderAtom)).toBe(DefaultLoader)
  })
  it('should allow updating AuthStateAtom', () => {
    const mockAuth = { token: 'abc123' }
    store.set(AuthStateAtom, mockAuth)
    expect(store.get(AuthStateAtom)).toEqual(mockAuth)
  })
  it('should allow updating TimezoneAtom', () => {
    store.set(TimezoneAtom, 'UTC')
    expect(store.get(TimezoneAtom)).toBe('UTC')
  })
})