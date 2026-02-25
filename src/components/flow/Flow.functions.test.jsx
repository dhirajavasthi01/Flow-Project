import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  restoreOriginalColors,
  applyHighlighting,
  processSingleNode,
  processNodesWithTableData,
  createTableDataKey,
  mergeProcessedNodesWithCurrent,
} from './Flow.functions.jsx'

/* -------------------- MOCKS -------------------- */
vi.mock('../../utills', () => ({
  shouldNodeBlink: vi.fn(),
  hasSubComponentAssetIdMatch: vi.fn(),
}))

import { shouldNodeBlink, hasSubComponentAssetIdMatch } from '../../utills'

const HIGHLIGHT = '#E35205'

/* -------------------- HELPERS -------------------- */
const baseNode = (overrides = {}) => ({
  id: '1',
  data: {
    nodeColor: 'blue',
    ...overrides,
  },
})

/* -------------------- TESTS -------------------- */

describe('restoreOriginalColors', () => {
  it('removes highlight colors when original data is missing', () => {
    const nodeData = {
      nodeColor: HIGHLIGHT,
      specialNodeColor: HIGHLIGHT,
      gradientStart: HIGHLIGHT,
      gradientEnd: HIGHLIGHT,
    }

    restoreOriginalColors(nodeData, null)

    expect(nodeData).toEqual({})
  })

  it('restores gradient colors with highest priority', () => {
    const nodeData = {
      gradientStart: HIGHLIGHT,
      gradientEnd: HIGHLIGHT,
      nodeColor: HIGHLIGHT,
    }

    const original = {
      gradientStart: 'red',
      gradientEnd: 'green',
    }

    restoreOriginalColors(nodeData, original)

    expect(nodeData.gradientStart).toBe('red')
    expect(nodeData.gradientEnd).toBe('green')
    expect(nodeData.nodeColor).toBeUndefined()
  })

  it('restores specialNodeColor when present', () => {
    const nodeData = { specialNodeColor: HIGHLIGHT }
    const original = { specialNodeColor: 'purple' }

    restoreOriginalColors(nodeData, original)

    expect(nodeData.specialNodeColor).toBe('purple')
  })

  it('restores nodeColor as fallback', () => {
    const nodeData = { nodeColor: HIGHLIGHT }
    const original = { nodeColor: 'orange' }

    restoreOriginalColors(nodeData, original)

    expect(nodeData.nodeColor).toBe('orange')
  })
})

describe('applyHighlighting', () => {
  beforeEach(() => {
    shouldNodeBlink.mockReturnValue({ shouldBlink: true })
  })

  it('applies gradient highlighting and blinking', () => {
    const nodeData = {
      gradientStart: 'a',
      gradientEnd: 'b',
    }

    const tableData = [
      { activeSince: 10, forecastDays: 3, failureModeName: 'FM1' },
    ]

    applyHighlighting(nodeData, tableData, 20)

    expect(nodeData.gradientStart).toBe(HIGHLIGHT)
    expect(nodeData.gradientEnd).toBe(HIGHLIGHT)
    expect(nodeData.shouldBlink).toBe(true)
    expect(nodeData.ttfDays).toBe(3)
    expect(nodeData.failureModeNames).toEqual(['FM1'])
  })

  it('applies specialNodeColor for special nodes', () => {
    const nodeData = { isSpecialNode: true }

    applyHighlighting(nodeData, [{}], 0)

    expect(nodeData.specialNodeColor).toBe(HIGHLIGHT)
  })

  it('applies nodeColor for normal nodes', () => {
    const nodeData = {}

    applyHighlighting(nodeData, [{}], 0)

    expect(nodeData.nodeColor).toBe(HIGHLIGHT)
  })
})

describe('processSingleNode', () => {
  beforeEach(() => {
    hasSubComponentAssetIdMatch.mockReturnValue(true)
    shouldNodeBlink.mockReturnValue({ shouldBlink: false })
  })

  it('restores node when subComponentAssetId is missing', () => {
    const node = baseNode()
    const result = processSingleNode(node, 0, [node], [], 0)

    expect(result.data.failureModeNames).toBeUndefined()
    expect(result.data.shouldBlink).toBeUndefined()
  })

  it('applies highlighting when table data matches', () => {
    const node = baseNode({ subComponentAssetId: 'A1' })

    const result = processSingleNode(
      node,
      0,
      [node],
      [{ subComponentAssetId: 'A1' }],
      0,
    )

    expect(result.data.nodeColor).toBe(HIGHLIGHT)
  })

  it('restores colors when no table data matches', () => {
    hasSubComponentAssetIdMatch.mockReturnValue(false)

    const node = baseNode({
      subComponentAssetId: 'A1',
      nodeColor: HIGHLIGHT,
    })

    const result = processSingleNode(node, 0, [node], [], 0)

    expect(result.data.nodeColor).toBe(undefined)
  })
})

describe('processNodesWithTableData', () => {
  it('returns nodes unchanged in developer mode', () => {
    const nodes = [baseNode()]
    const result = processNodesWithTableData(nodes, nodes, [], true, 0)

    expect(result).toBe(nodes)
  })

  it('resets nodes when tableData is empty', () => {
    const node = baseNode({ nodeColor: HIGHLIGHT })

    const result = processNodesWithTableData([node], [node], [], false, 0)

    expect(result[0].data.nodeColor).toBe(undefined)
  })
})

describe('createTableDataKey', () => {
  it('returns EMPTY_TABLEDATA when empty', () => {
    expect(createTableDataKey([])).toBe('EMPTY_TABLEDATA')
  })

  it('creates stable key from table data', () => {
    const key = createTableDataKey([
      {
        subComponentAssetId: 'A1',
        failureModeName: 'FM',
        activeSince: 1,
      },
    ])

    expect(key).toContain('A1')
    expect(key).toContain('FM')
  })
})

describe('mergeProcessedNodesWithCurrent', () => {
  it('returns processed nodes if current nodes are empty', () => {
    const processed = [{ id: '1', data: {} }]

    expect(mergeProcessedNodesWithCurrent(processed, [])).toBe(processed)
  })

  it('merges color and highlight properties correctly', () => {
    const processed = [
      {
        id: '1',
        data: {
          nodeColor: HIGHLIGHT,
          shouldBlink: true,
          failureModeNames: ['FM'],
          ttfDays: 2,
        },
      },
    ]

    const current = [
      {
        id: '1',
        width: 100,
        height: 100,
        position: { x: 0, y: 0 },
        data: { nodeColor: 'blue' },
      },
    ]

    const result = mergeProcessedNodesWithCurrent(processed, current)

    expect(result[0].data.nodeColor).toBe(HIGHLIGHT)
    expect(result[0].data.shouldBlink).toBe(true)
    expect(result[0].width).toBe(100)
  })
})
