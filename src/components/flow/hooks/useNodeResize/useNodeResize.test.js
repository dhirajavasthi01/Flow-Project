import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  syncNodeDimensions,
  applyResizeChanges,
  isResizingRef,
  persistResizeChangesRef,
  useNodeResize,
} from './useNodeResize'

/* =========================
   MOCK @xyflow/react
========================= */
const setNodesMock = vi.fn()

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    setNodes: setNodesMock,
  }),
}))

/* =========================
   syncNodeDimensions
========================= */
describe('syncNodeDimensions', () => {
  it('returns node as-is when style width & height exist (Priority 1)', () => {
    const node = {
      id: '1',
      style: { width: 100, height: 200 },
    }

    const result = syncNodeDimensions(node)

    expect(result).toBe(node)
  })

  it('syncs dimensions from root level width/height (Priority 2)', () => {
    const node = {
      id: '1',
      width: 300,
      height: 400,
      style: {},
      data: {},
    }

    const result = syncNodeDimensions(node)

    expect(result.width).toBe(300)
    expect(result.height).toBe(400)
    expect(result.style.width).toBe(300)
    expect(result.style.height).toBe(400)
    expect(result.data.width).toBe(300)
    expect(result.data.height).toBe(400)
  })

  it('syncs dimensions from data (Priority 3)', () => {
    const node = {
      id: '1',
      data: { width: 150, height: 160 },
      style: {},
    }

    const result = syncNodeDimensions(node)

    expect(result.width).toBe(150)
    expect(result.height).toBe(160)
    expect(result.style.width).toBe(150)
    expect(result.style.height).toBe(160)
  })

  it('applies default dimensions when no dimensions exist (Priority 4)', () => {
    const node = {
      id: '1',
      data: {},
      style: {},
    }

    const result = syncNodeDimensions(node)

    expect(result.width).toBe(250)
    expect(result.height).toBe(250)
    expect(result.style.width).toBe(250)
    expect(result.style.height).toBe(250)
    expect(result.data.width).toBe(250)
    expect(result.data.height).toBe(250)
  })

  it('returns node unchanged if partial dimensions exist but no valid pair', () => {
    const node = {
      id: '1',
      width: 100,
    }

    const result = syncNodeDimensions(node)

    expect(result).toBe(node)
  })
})

/* =========================
   applyResizeChanges
========================= */
describe('applyResizeChanges', () => {
  it('returns original node if no resize change exists', () => {
    const nodes = [{ id: '1', width: 100, height: 100 }]
    const changes = []

    const result = applyResizeChanges(nodes, changes)

    expect(result).toEqual(nodes)
  })

  it('applies resize change dimensions correctly', () => {
    const nodes = [
      {
        id: '1',
        width: 100,
        height: 100,
        style: {},
        data: {},
        position: { x: 0, y: 0 },
      },
    ]

    const changes = [
      {
        id: '1',
        type: 'resize',
        dimensions: { width: 200, height: 300 },
      },
    ]

    const result = applyResizeChanges(nodes, changes)

    expect(result[0].width).toBe(200)
    expect(result[0].height).toBe(300)
    expect(result[0].style.width).toBe(200)
    expect(result[0].style.height).toBe(300)
    expect(result[0].data.width).toBe(200)
    expect(result[0].data.height).toBe(300)
  })

  it('does not update node if final dimensions are missing', () => {
    const nodes = [
      {
        id: '1',
        style: {},
        data: {},
      },
    ]

    const changes = [
      {
        id: '1',
        type: 'resize',
        dimensions: {},
      },
    ]

    const result = applyResizeChanges(nodes, changes)

    expect(result[0]).toBe(nodes[0])
  })
})

/* =========================
   Global refs
========================= */
describe('global resize refs', () => {
  it('tracks resizing flag correctly', () => {
    isResizingRef.current = true
    expect(isResizingRef.current).toBe(true)

    isResizingRef.current = false
    expect(isResizingRef.current).toBe(false)
  })

  it('stores persist callback', () => {
    const fn = vi.fn()
    persistResizeChangesRef.current = fn

    expect(persistResizeChangesRef.current).toBe(fn)
  })
})

/* =========================
   useNodeResize hook
========================= */
describe('useNodeResize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isResizingRef.current = false
  })

  it('onResize updates node dimensions in real time', () => {
    const { result } = renderHook(() => useNodeResize('1'))

    act(() => {
      result.current.onResize({}, { width: 120, height: 130 })
    })

    expect(isResizingRef.current).toBe(true)
    expect(setNodesMock).toHaveBeenCalled()
  })

  it('onResizeEnd updates dimensions and persists changes', async () => {
    vi.useFakeTimers()

    const persistMock = vi.fn()
    persistResizeChangesRef.current = persistMock

    setNodesMock.mockImplementation((updater) => {
      const nodes = [
        {
          id: '1',
          width: 100,
          height: 100,
          style: {},
          data: {},
          position: { x: 0, y: 0 },
        },
      ]

      return updater(nodes)
    })

    const { result } = renderHook(() => useNodeResize('1'))

    act(() => {
      result.current.onResizeEnd({}, { width: 400, height: 500 })
    })

    vi.runAllTimers()

    expect(persistMock).toHaveBeenCalledTimes(1)
    expect(isResizingRef.current).toBe(false)

    vi.useRealTimers()
  })
})
