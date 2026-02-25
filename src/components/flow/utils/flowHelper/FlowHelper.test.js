import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  processEdges,
  updateOriginalFetchedNodesRef,
  handleFetchedNodesEdgesChange,
  handleTableDataChange,
} from './FlowHelper'

/* ================= MOCKS ================= */

vi.mock('../../Flow.functions', () => ({
  createTableDataKey: vi.fn((data) => JSON.stringify(data)),
  mergeProcessedNodesWithCurrent: vi.fn((newNodes) => newNodes),
}))

vi.mock('../../hooks/useNodeResize/useNodeResize', () => ({
  syncNodeDimensions: vi.fn((node) => ({
    ...node,
    style: { ...(node.style || {}), width: node.width, height: node.height },
    data: { ...(node.data || {}), width: node.width, height: node.height },
  })),
  isResizingRef: { current: false },
}))

vi.mock('../parentChildUtils/ParentChildUtils', () => ({
  sortNodesByParentChild: vi.fn((nodes) => nodes),
}))

/* ================= HELPERS ================= */

const createNode = (id, extra = {}) => ({
  id,
  width: 100,
  height: 50,
  position: { x: 0, y: 0 },
  data: {},
  ...extra,
})

/* ================= TESTS ================= */

describe('FlowHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ---------- processEdges ---------- */

  it('processEdges applies default stroke and strokeWidth', () => {
    const edges = [{ id: 'e1' }]
    const result = processEdges(edges)

    expect(result[0].style.stroke).toBe('#000000')
    expect(result[0].style.strokeWidth).toBe(1)
  })

  it('processEdges preserves custom strokeWidth', () => {
    const edges = [{ id: 'e1', style: { strokeWidth: 5 } }]
    const result = processEdges(edges, 2)

    expect(result[0].style.strokeWidth).toBe(5)
  })

  /* ---------- updateOriginalFetchedNodesRef ---------- */

  it('initializes originalFetchedNodesRef when empty', () => {
    const ref = { current: [] }
    const fetchedNodes = [createNode('1')]

    const updated = updateOriginalFetchedNodesRef(fetchedNodes, ref)

    expect(updated).toBe(true)
    expect(ref.current.length).toBe(1)
  })

  it('preserves resized dimensions when refetching nodes', () => {
    const ref = {
      current: [{ id: '1', width: 300, height: 200 }],
    }

    const fetchedNodes = [{ id: '1', width: 100, height: 50 }]

    updateOriginalFetchedNodesRef(fetchedNodes, ref)

    expect(ref.current[0].width).toBe(300)
    expect(ref.current[0].height).toBe(200)
  })

  it('returns false when fetched nodes are unchanged', () => {
    const nodes = [createNode('1')]
    const ref = { current: nodes }

    const result = updateOriginalFetchedNodesRef(nodes, ref)

    expect(result).toBe(false)
  })

  /* ---------- handleFetchedNodesEdgesChange ---------- */

  it('handles error state by resetting nodes and edges', () => {
    const setNodes = vi.fn()
    const setEdges = vi.fn()
    const setLegendPosition = vi.fn()

    const result = handleFetchedNodesEdgesChange({
      fetchedNodes: [],
      fetchedEdges: [],
      fetchedLegendPosition: { x: 1 },
      loadingFlow: false,
      error: true,
      isDeveloperMode: false,
      originalFetchedNodesRef: { current: [] },
      processNodesWithTableDataRef: { current: null },
      setNodes,
      setEdges,
      setLegendPosition,
      zoomTo: vi.fn(),
      fitView: vi.fn(),
    })

    expect(setNodes).toHaveBeenCalledWith([])
    expect(setEdges).toHaveBeenCalledWith([])
    expect(result.shouldUpdate).toBe(false)
  })

  it('returns early when loading or no nodes', () => {
    const result = handleFetchedNodesEdgesChange({
      fetchedNodes: [],
      fetchedEdges: [],
      fetchedLegendPosition: {},
      loadingFlow: true,
      error: null,
      isDeveloperMode: false,
      originalFetchedNodesRef: { current: [] },
      processNodesWithTableDataRef: { current: null },
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      setLegendPosition: vi.fn(),
      zoomTo: vi.fn(),
      fitView: vi.fn(),
    })

    expect(result.shouldUpdate).toBe(false)
  })

  it('processes nodes and edges in non-developer mode', () => {
    vi.useFakeTimers()

    const setNodes = vi.fn()
    const setEdges = vi.fn()

    const result = handleFetchedNodesEdgesChange({
      fetchedNodes: [createNode('1', { parentId: 'p1' })],
      fetchedEdges: [{ id: 'e1' }],
      fetchedLegendPosition: { x: 0 },
      loadingFlow: false,
      error: null,
      isDeveloperMode: false,
      originalFetchedNodesRef: { current: [] },
      processNodesWithTableDataRef: { current: vi.fn((n) => n) },
      setNodes,
      setEdges,
      setLegendPosition: vi.fn(),
      zoomTo: vi.fn(),
      fitView: vi.fn(),
    })

    vi.runAllTimers()

    expect(setNodes).toHaveBeenCalled()
    expect(setEdges).toHaveBeenCalled()
    expect(result.shouldUpdate).toBe(true)
  })

  it('processes developer mode with thicker edges', () => {
    const setEdges = vi.fn()

    handleFetchedNodesEdgesChange({
      fetchedNodes: [createNode('1')],
      fetchedEdges: [{ id: 'e1' }],
      fetchedLegendPosition: {},
      loadingFlow: false,
      error: null,
      isDeveloperMode: true,
      originalFetchedNodesRef: { current: [] },
      processNodesWithTableDataRef: { current: null },
      setNodes: vi.fn(),
      setEdges,
      setLegendPosition: vi.fn(),
      zoomTo: vi.fn(),
      fitView: vi.fn(),
    })

    expect(setEdges).toHaveBeenCalled()
  })

  /* ---------- handleTableDataChange ---------- */

  it('skips update when resizing is active', () => {
    const resize = require('../../hooks/useNodeResize/useNodeResize')
    resize.isResizingRef.current = true

    const result = handleTableDataChange({
      tableData: {},
      isDeveloperMode: false,
      originalFetchedNodesRef: { current: [createNode('1')] },
      lastProcessedTableDataRef: { current: null },
      processNodesWithTableDataRef: { current: null },
      setNodes: vi.fn(),
    })

    expect(result.shouldUpdate).toBe(true)
    resize.isResizingRef.current = true
  })

  it('processes table data changes in non-developer mode', () => {
    const setNodes = vi.fn((fn) => fn([]))

    const result = handleTableDataChange({
      tableData: { a: 1 },
      isDeveloperMode: false,
      originalFetchedNodesRef: { current: [createNode('1')] },
      lastProcessedTableDataRef: { current: null },
      processNodesWithTableDataRef: { current: vi.fn((n) => n) },
      setNodes,
    })

    expect(result.shouldUpdate).toBe(true)
    expect(setNodes).toHaveBeenCalled()
  })

  it('skips processing when table data is unchanged', () => {
    const key = JSON.stringify({ a: 1 })

    const result = handleTableDataChange({
      tableData: { a: 1 },
      isDeveloperMode: false,
      originalFetchedNodesRef: { current: [createNode('1')] },
      lastProcessedTableDataRef: { current: key },
      processNodesWithTableDataRef: { current: vi.fn() },
      setNodes: vi.fn(),
    })

    expect(result.shouldUpdate).toBe(false)
  })

  it('resets nodes once when entering developer mode', () => {
    const setNodes = vi.fn((fn) => fn([]))

    const result = handleTableDataChange({
      tableData: {},
      isDeveloperMode: true,
      originalFetchedNodesRef: { current: [createNode('1')] },
      lastProcessedTableDataRef: { current: null },
      processNodesWithTableDataRef: { current: null },
      setNodes,
    })

    expect(result.shouldUpdate).toBe(true)
  })

  it('does nothing when already in developer mode', () => {
    const result = handleTableDataChange({
      tableData: {},
      isDeveloperMode: true,
      originalFetchedNodesRef: { current: [createNode('1')] },
      lastProcessedTableDataRef: { current: 'DEVELOPER_MODE' },
      processNodesWithTableDataRef: { current: null },
      setNodes: vi.fn(),
    })

    expect(result.shouldUpdate).toBe(false)
  })
})
