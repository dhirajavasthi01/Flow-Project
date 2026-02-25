import { describe, it, expect } from 'vitest'

import {
  absoluteToRelative,
  relativeToAbsolute,
  isPointInNode,
  getChildNodes,
  canBeParent,
  wouldCreateCircularDependency,
  getDescendantIds,
  canBeGroupNode,
  getGroupNodes,
  findGroupNodeAtPoint,
  sortNodesByParentChild,
} from './ParentChildUtils'

/* =========================
   Position utils
========================= */
describe('absolute / relative position utils', () => {
  it('converts absolute to relative position', () => {
    const result = absoluteToRelative({ x: 10, y: 20 }, { x: 5, y: 5 })
    expect(result).toEqual({ x: 5, y: 15 })
  })

  it('converts relative to absolute position', () => {
    const result = relativeToAbsolute({ x: 5, y: 15 }, { x: 5, y: 5 })
    expect(result).toEqual({ x: 10, y: 20 })
  })
})

/* =========================
   isPointInNode
========================= */
describe('isPointInNode', () => {
  it('returns false if node has no position', () => {
    expect(isPointInNode({ x: 1, y: 1 }, {})).toBe(false)
  })

  it('returns true when point is inside node bounds', () => {
    const node = {
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
    }

    expect(isPointInNode({ x: 50, y: 50 }, node)).toBe(true)
  })

  it('uses default dimensions when width/height missing', () => {
    const node = {
      position: { x: 0, y: 0 },
      data: {},
    }

    expect(isPointInNode({ x: 100, y: 100 }, node)).toBe(true)
    expect(isPointInNode({ x: 200, y: 200 }, node)).toBe(false)
  })
})

/* =========================
   Parent / child helpers
========================= */
describe('getChildNodes', () => {
  it('returns all children for given parentId', () => {
    const nodes = [
      { id: '1' },
      { id: '2', parentId: '1' },
      { id: '3', parentId: '1' },
    ]

    const result = getChildNodes(nodes, '1')
    expect(result.map((n) => n.id)).toEqual(['2', '3'])
  })
})

describe('canBeParent', () => {
  it('returns true if node has no parent', () => {
    expect(canBeParent({ id: '1' })).toBe(true)
  })

  it('returns false if node already has parent', () => {
    expect(canBeParent({ id: '2', parentId: '1' })).toBe(false)
  })
})

/* =========================
   Circular dependency
========================= */
describe('wouldCreateCircularDependency', () => {
  it('returns true if childId equals parentId', () => {
    expect(wouldCreateCircularDependency([], '1', '1')).toBe(true)
  })

  it('detects circular dependency through ancestors', () => {
    const nodes = [
      { id: '1', parentId: '2' },
      { id: '2', parentId: '3' },
      { id: '3' },
    ]

    expect(wouldCreateCircularDependency(nodes, '3', '1')).toBe(true)
  })

  it('returns false when no circular dependency exists', () => {
    const nodes = [
      { id: '1' },
      { id: '2', parentId: '1' },
      { id: '3', parentId: '2' },
    ]

    expect(wouldCreateCircularDependency(nodes, '1', '3')).toBe(true)
  })
})

/* =========================
   Descendants
========================= */
describe('getDescendantIds', () => {
  it('returns all descendant ids recursively', () => {
    const nodes = [
      { id: '1' },
      { id: '2', parentId: '1' },
      { id: '3', parentId: '2' },
      { id: '4', parentId: '1' },
    ]

    const result = getDescendantIds(nodes, '1')
    expect([...result].sort()).toEqual(['2', '3', '4'])
  })
})

/* =========================
   Group node checks
========================= */
describe('canBeGroupNode', () => {
  it('returns false for dot nodes', () => {
    expect(canBeGroupNode({ type: 'dotNode' })).toBe(false)
  })

  it('returns false for text box nodes', () => {
    expect(canBeGroupNode({ type: 'textBoxNode' })).toBe(false)
  })

  it('returns false for nodes with parent', () => {
    expect(canBeGroupNode({ parentId: '1' })).toBe(false)
  })

  it('returns true for valid group nodes', () => {
    expect(canBeGroupNode({ id: '1' })).toBe(true)
  })
})

describe('getGroupNodes', () => {
  it('filters only group-capable nodes', () => {
    const nodes = [
      { id: '1' },
      { id: '2', type: 'dotNode' },
      { id: '3', parentId: '1' },
    ]

    const result = getGroupNodes(nodes)
    expect(result.map((n) => n.id)).toEqual(['1'])
  })
})

/* =========================
   findGroupNodeAtPoint
========================= */
describe('findGroupNodeAtPoint', () => {
  it('returns the largest matching group node at point', () => {
    const nodes = [
      {
        id: 'small',
        position: { x: 0, y: 0 },
        width: 50,
        height: 50,
      },
      {
        id: 'large',
        position: { x: 0, y: 0 },
        width: 200,
        height: 200,
      },
    ]

    const result = findGroupNodeAtPoint(nodes, { x: 10, y: 10 })

    expect(result.id).toBe('large')
  })

  it('returns null when no node matches', () => {
    const nodes = [
      {
        id: '1',
        position: { x: 0, y: 0 },
        width: 50,
        height: 50,
      },
    ]

    const result = findGroupNodeAtPoint(nodes, { x: 100, y: 100 })

    expect(result).toBe(null)
  })

  it('excludes specified node id', () => {
    const nodes = [
      {
        id: '1',
        position: { x: 0, y: 0 },
        width: 200,
        height: 200,
      },
    ]

    const result = findGroupNodeAtPoint(nodes, { x: 10, y: 10 }, '1')

    expect(result).toBe(null)
  })
})

/* =========================
   Sorting
========================= */
describe('sortNodesByParentChild', () => {
  it('sorts parents before children', () => {
    const nodes = [
      { id: 'child', parentId: 'parent' },
      { id: 'parent' },
      { id: 'grandchild', parentId: 'child' },
    ]

    const result = sortNodesByParentChild(nodes)

    expect(result.map((n) => n.id)).toEqual(['parent', 'child', 'grandchild'])
  })

  it('adds orphan nodes at the end', () => {
    const nodes = [{ id: '1', parentId: 'x' }, { id: '2' }]

    const result = sortNodesByParentChild(nodes)
    expect(result.map((n) => n.id)).toEqual(['2', '1'])
  })
})
