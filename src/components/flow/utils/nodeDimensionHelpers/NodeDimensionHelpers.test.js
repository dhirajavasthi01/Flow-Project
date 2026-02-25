import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkForDimensionChanges,
  updateCurrentDimensions,
} from './NodeDimensionHelpers'

describe('Node Dimension Helper Functions', () => {
  let prevNodeDimensionsRef
  let originalFetchedNodesRef
  let getNodeDimension
  let CompareValuesWithSymbol

  beforeEach(() => {
    prevNodeDimensionsRef = { current: new Map() }
    originalFetchedNodesRef = { current: [] }

    getNodeDimension = vi.fn((node, key) => node[key])

    CompareValuesWithSymbol = vi.fn((symbol, a, b) => {
      if (symbol === '&&') return a && b
      if (symbol === '||') return a || b
      return false
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // checkForDimensionChanges
  // ============================================

  describe('checkForDimensionChanges', () => {
    it('returns false when nodes have no valid dimensions', () => {
      const nodes = [{ id: '1', width: NaN, height: NaN }]

      const result = checkForDimensionChanges({
        nodes,
        prevNodeDimensionsRef,
        originalFetchedNodesRef,
        getNodeDimension,
        CompareValuesWithSymbol,
      })

      expect(result).toBe(false)
      expect(prevNodeDimensionsRef.current.size).toBe(0)
    })

    it('stores initial dimensions when prevDims do not exist', () => {
      const nodes = [{ id: '1', width: 100, height: 200 }]

      const result = checkForDimensionChanges({
        nodes,
        prevNodeDimensionsRef,
        originalFetchedNodesRef,
        getNodeDimension,
        CompareValuesWithSymbol,
      })

      expect(result).toBe(false)
      expect(prevNodeDimensionsRef.current.get('1')).toEqual({
        width: 100,
        height: 200,
      })
    })

    it('detects dimension changes correctly', () => {
      prevNodeDimensionsRef.current.set('1', { width: 100, height: 200 })

      const nodes = [{ id: '1', width: 150, height: 200 }]

      const result = checkForDimensionChanges({
        nodes,
        prevNodeDimensionsRef,
        originalFetchedNodesRef,
        getNodeDimension,
        CompareValuesWithSymbol,
      })

      expect(result).toBe(true)
    })

    it('does not detect change when dimensions are same', () => {
      prevNodeDimensionsRef.current.set('1', { width: 100, height: 200 })

      const nodes = [{ id: '1', width: 100, height: 200 }]

      const result = checkForDimensionChanges({
        nodes,
        prevNodeDimensionsRef,
        originalFetchedNodesRef,
        getNodeDimension,
        CompareValuesWithSymbol,
      })

      expect(result).toBe(false)
    })

    it('uses originalFetchedNodesRef when prevDims is missing', () => {
      originalFetchedNodesRef.current = [{ id: '1', width: 100, height: 200 }]

      const nodes = [{ id: '1', width: 100, height: 200 }]

      const result = checkForDimensionChanges({
        nodes,
        prevNodeDimensionsRef,
        originalFetchedNodesRef,
        getNodeDimension,
        CompareValuesWithSymbol,
      })

      expect(result).toBe(false)
      expect(prevNodeDimensionsRef.current.get('1')).toEqual({
        width: 100,
        height: 200,
      })
    })
  })

  // ============================================
  // updateCurrentDimensions
  // ============================================

  describe('updateCurrentDimensions', () => {
    it('updates valid dimensions into ref', () => {
      const nodes = [{ id: '1', width: 300, height: 400 }]

      updateCurrentDimensions({
        nodes,
        prevNodeDimensionsRef,
        getNodeDimension,
        CompareValuesWithSymbol,
      })

      expect(prevNodeDimensionsRef.current.get('1')).toEqual({
        width: 300,
        height: 400,
      })
    })

    it('does not update when dimensions are invalid', () => {
      const nodes = [{ id: '1', width: NaN, height: 200 }]

      updateCurrentDimensions({
        nodes,
        prevNodeDimensionsRef,
        getNodeDimension,
        CompareValuesWithSymbol,
      })

      expect(prevNodeDimensionsRef.current.size).toBe(0)
    })
  })
})
