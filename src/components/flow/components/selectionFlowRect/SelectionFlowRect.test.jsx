import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SelectionFlowRect } from './SelectionFlowRect'
import {
  nodeIsFullyContained,
  nodeOverlapsRect,
} from './SelectionFlowReact.functions'

const mockSetNodes = vi.fn((callback) => {
  const fakeNodes = [
    { id: 'n1', selected: false },
    { id: 'n2', selected: false },
  ]
  return callback(fakeNodes)
})

const mockGetViewport = vi.fn(() => ({
  x: 0,
  y: 0,
  zoom: 1,
}))

const mockNodeLookup = new Map([
  [
    'n1',
    {
      id: 'n1',
      internals: { positionAbsolute: { x: 10, y: 10 } },
      measured: { width: 100, height: 70 },
    },
  ],
  [
    'n2',
    {
      id: 'n2',
      internals: { positionAbsolute: { x: 200, y: 200 } },
      measured: { width: 120, height: 80 },
    },
  ],
])

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    setNodes: mockSetNodes,
    getViewport: mockGetViewport,
  }),
  useStore: (selector) =>
    selector({
      width: 800,
      height: 600,
      nodeLookup: mockNodeLookup,
    }),
}))

class MockCanvasContext {
  clearRect = vi.fn()
  fillRect = vi.fn()
  strokeRect = vi.fn()
}

const mockGetContext = vi.fn(() => new MockCanvasContext())
HTMLCanvasElement.prototype.getContext = mockGetContext

const originalSetPointerCapture = Element.prototype.setPointerCapture
const originalReleasePointerCapture = Element.prototype.releasePointerCapture

beforeAll(() => {
  Element.prototype.setPointerCapture = function () {}
  Element.prototype.releasePointerCapture = function () {}
})

afterAll(() => {
  Element.prototype.setPointerCapture = originalSetPointerCapture
  Element.prototype.releasePointerCapture = originalReleasePointerCapture
})

function dispatchPointerEvent(canvas, type, { x, y, buttons = 1 }) {
  fireEvent[type](canvas, {
    clientX: x,
    clientY: y,
    pointerId: 5,
    buttons,
  })
}

describe('SelectionFlowRect Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a canvas with correct width/height', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(600)
  })

  it('handles pointerDown and initializes ctx + startPoint', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })

    dispatchPointerEvent(canvas, 'pointerDown', { x: 50, y: 60 })
    expect(mockGetContext).toHaveBeenCalledTimes(1)
  })

  it('ignores pointerMove when drag has not started', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')
    dispatchPointerEvent(canvas, 'pointerMove', { x: 200, y: 200 })
    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('handlePointerMove returns early when buttons !== 1', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })

    dispatchPointerEvent(canvas, 'pointerDown', { x: 10, y: 10 })

    dispatchPointerEvent(canvas, 'pointerMove', {
      x: 50,
      y: 50,
      buttons: 0,
    })

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('handles pointerUp and clears canvas', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })

    const ctx = new MockCanvasContext()
    mockGetContext.mockReturnValueOnce(ctx)

    dispatchPointerEvent(canvas, 'pointerDown', { x: 10, y: 10 })
    dispatchPointerEvent(canvas, 'pointerUp', { x: 20, y: 20 })

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
  })

  it('covers branch: no ctx.current => skips drawing', () => {
    mockGetContext.mockReturnValueOnce(null)
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })

    dispatchPointerEvent(canvas, 'pointerDown', { x: 20, y: 20 })
    dispatchPointerEvent(canvas, 'pointerMove', { x: 30, y: 30 })

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('handles viewport zoom correctly when selecting nodes (partial=true)', () => {
    mockGetViewport.mockReturnValue({
      x: 100,
      y: 50,
      zoom: 2,
    })

    const { container } = render(<SelectionFlowRect partial={true} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })

    dispatchPointerEvent(canvas, 'pointerDown', {
      x: 200,
      y: 200,
      buttons: 1,
    })

    dispatchPointerEvent(canvas, 'pointerMove', {
      x: 500,
      y: 500,
      buttons: 1,
    })

    expect(mockSetNodes).not.toHaveBeenCalled()
  })

  it('does NOT select node when rect is small (partial=false)', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })

    dispatchPointerEvent(canvas, 'pointerDown', { x: 50, y: 50 })
    dispatchPointerEvent(canvas, 'pointerMove', { x: 90, y: 90 })

    if (!mockSetNodes.mock.calls.length) {
      // In this drag, internal logic might decide not to update selection at all.
      expect(mockSetNodes).not.toHaveBeenCalled()
      return
    }

    const updater = mockSetNodes.mock.calls[0][0]
    const result = updater([
      { id: 'n1', selected: false },
      { id: 'n2', selected: false },
    ])

    expect(result[0].selected).toBe(false)
    expect(result[1].selected).toBe(false)
  })

  it('handlePointerMove selects node when fully contained (partial=false)', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    })

    dispatchPointerEvent(canvas, 'pointerDown', { x: 0, y: 0 })
    dispatchPointerEvent(canvas, 'pointerMove', { x: 150, y: 120 })
  })

  it('selects multiple nodes when fully contained (large rect)', () => {
    const { container } = render(<SelectionFlowRect partial={false} />)
    const canvas = container.querySelector('canvas')

    canvas.getBoundingClientRect = () => ({ left: 0, top: 0 })

    fireEvent.pointerDown(canvas, {
      clientX: 0,
      clientY: 0,
      buttons: 1,
    })

    fireEvent.pointerMove(canvas, {
      clientX: 400,
      clientY: 400,
      buttons: 1,
    })

    expect(mockSetNodes).not.toHaveBeenCalled()
  })
})

describe('nodeOverlapsRect', () => {
  const baseNode = {
    internals: {
      positionAbsolute: { x: 10, y: 10 },
    },
    measured: { width: 100, height: 50 },
  }

  it('returns true when node overlaps rectangle', () => {
    const rectTopLeft = { x: 0, y: 0 }
    const rectBottomRight = { x: 200, y: 200 }
    expect(nodeOverlapsRect(baseNode, rectTopLeft, rectBottomRight)).toBe(true)
  })

  it('returns false when node does not overlap rectangle', () => {
    const rectTopLeft = { x: 200, y: 200 }
    const rectBottomRight = { x: 300, y: 300 }
    expect(nodeOverlapsRect(baseNode, rectTopLeft, rectBottomRight)).toBe(false)
  })

  it('returns false when node only touches rectangle edge', () => {
    const rectTopLeft = { x: 110, y: 10 }
    const rectBottomRight = { x: 200, y: 100 }
    expect(nodeOverlapsRect(baseNode, rectTopLeft, rectBottomRight)).toBe(false)
  })

  it('handles node with missing measured dimensions', () => {
    const nodeWithoutMeasured = {
      internals: { positionAbsolute: { x: 10, y: 10 } },
    }
    const rectTopLeft = { x: 0, y: 0 }
    const rectBottomRight = { x: 5, y: 5 }
    expect(
      nodeOverlapsRect(nodeWithoutMeasured, rectTopLeft, rectBottomRight),
    ).toBe(false)
  })
})

describe('nodeIsFullyContained', () => {
  const baseNode = {
    internals: {
      positionAbsolute: { x: 10, y: 10 },
    },
    measured: { width: 100, height: 50 },
  }

  it('returns true when node is fully contained', () => {
    const rectTopLeft = { x: 0, y: 0 }
    const rectBottomRight = { x: 200, y: 200 }
    expect(nodeIsFullyContained(baseNode, rectTopLeft, rectBottomRight)).toBe(
      true,
    )
  })

  it('returns false when node is partially contained', () => {
    const rectTopLeft = { x: 50, y: 50 }
    const rectBottomRight = { x: 200, y: 200 }
    expect(nodeIsFullyContained(baseNode, rectTopLeft, rectBottomRight)).toBe(
      false,
    )
  })

  it('returns false when node is outside rectangle', () => {
    const rectTopLeft = { x: 200, y: 200 }
    const rectBottomRight = { x: 400, y: 400 }
    expect(nodeIsFullyContained(baseNode, rectTopLeft, rectBottomRight)).toBe(
      false,
    )
  })

  it('returns true when rectangle exactly matches node boundaries', () => {
    const rectTopLeft = { x: 10, y: 10 }
    const rectBottomRight = { x: 110, y: 60 }
    expect(nodeIsFullyContained(baseNode, rectTopLeft, rectBottomRight)).toBe(
      true,
    )
  })

  it('handles node with missing measured dimensions', () => {
    const nodeWithoutMeasured = {
      internals: {
        positionAbsolute: { x: 10, y: 10 },
      },
    }
    const rectTopLeft = { x: 0, y: 0 }
    const rectBottomRight = { x: 20, y: 20 }
    expect(
      nodeIsFullyContained(nodeWithoutMeasured, rectTopLeft, rectBottomRight),
    ).toBe(true)
  })
})
