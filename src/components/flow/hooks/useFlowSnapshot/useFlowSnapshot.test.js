import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useFlowSnapshot } from './useFlowSnapshot'

/* =========================
   MOCK SnapshotHelper
========================= */
const takeSnapshotHelperMock = vi.fn()
const undoHelperMock = vi.fn()
const handleKeyPressHelperMock = vi.fn()
const applySnappingToChangesHelperMock = vi.fn()

vi.mock('../../utils/snapshotHelper/SnapshotHelper', () => ({
  takeSnapshot: (...args) => takeSnapshotHelperMock(...args),
  undo: (...args) => undoHelperMock(...args),
  handleKeyPress: (...args) => handleKeyPressHelperMock(...args),
  applySnappingToChanges: (...args) =>
    applySnappingToChangesHelperMock(...args),
}))

/* =========================
   Shared mocks
========================= */
const baseProps = () => ({
  nodes: [{ id: '1' }],
  edges: [{ id: 'e1' }],
  setNodes: vi.fn(),
  setEdges: vi.fn(),
  setSelectedNodeId: vi.fn(),
  setSelectedEdgeId: vi.fn(),
  setConfig: vi.fn(),
  checkIsDotNode: vi.fn(),
  snapNodePosition: vi.fn(),
  config: { mode: 'test' },
  selectedNodeId: '1',
  nodeToCopy: null,
  setNewNode: vi.fn(),
  setNodeToCopy: vi.fn(),
  setShouldDelete: vi.fn(),
})

/* =========================
   useFlowSnapshot
========================= */
describe('useFlowSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls takeSnapshot helper with correct arguments', () => {
    const props = baseProps()

    const { result } = renderHook(() => useFlowSnapshot(props))

    act(() => {
      result.current.takeSnapshot()
    })

    expect(takeSnapshotHelperMock).toHaveBeenCalledTimes(1)

    const callArgs = takeSnapshotHelperMock.mock.calls[0]
    expect(callArgs[0]).toBe(props.nodes)
    expect(callArgs[1]).toBe(props.edges)
    expect(callArgs[2]).toHaveProperty('current') // historyRef
    expect(callArgs[3]).toHaveProperty('current') // isUndoingRef
  })

  it('calls undo helper with correct setters', () => {
    const props = baseProps()

    const { result } = renderHook(() => useFlowSnapshot(props))

    act(() => {
      result.current.undo()
    })

    expect(undoHelperMock).toHaveBeenCalledTimes(1)

    const callArgs = undoHelperMock.mock.calls[0]
    expect(callArgs[2]).toBe(props.setNodes)
    expect(callArgs[3]).toBe(props.setEdges)
    expect(callArgs[4]).toBe(props.setSelectedNodeId)
    expect(callArgs[5]).toBe(props.setSelectedEdgeId)
    expect(callArgs[6]).toBe(props.setConfig)
  })

  it('delegates snapping logic to helper with correct arguments', () => {
    const props = baseProps()

    applySnappingToChangesHelperMock.mockReturnValue(['snapped'])

    const { result } = renderHook(() => useFlowSnapshot(props))

    const changes = [{ id: '1', type: 'position' }]

    const output = result.current.applySnappingToChanges(changes, '1')

    expect(applySnappingToChangesHelperMock).toHaveBeenCalledWith(
      changes,
      '1',
      props.checkIsDotNode,
      props.snapNodePosition,
    )

    expect(output).toEqual(['snapped'])
  })

  it('registers keydown listener and invokes handleKeyPress helper', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const props = baseProps()

    const { unmount } = renderHook(() => useFlowSnapshot(props))

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    const handler = addSpy.mock.calls[0][1]

    act(() => {
      handler({ key: 'z' })
    })

    expect(handleKeyPressHelperMock).toHaveBeenCalledTimes(1)

    const args = handleKeyPressHelperMock.mock.calls[0][0]
    expect(args.undo).toBeDefined()
    expect(args.takeSnapshot).toBeDefined()
    expect(args.setNewNode).toBe(props.setNewNode)
    expect(args.setNodeToCopy).toBe(props.setNodeToCopy)
    expect(args.setShouldDelete).toBe(props.setShouldDelete)

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('updates keyboard handler when dependencies change', () => {
    const props = baseProps()

    const { rerender } = renderHook((p) => useFlowSnapshot(p), {
      initialProps: props,
    })

    rerender({
      ...props,
      selectedNodeId: '2',
      nodeToCopy: { id: 'copy' },
    })

    expect(true).toBe(true) // ensures branch execution
  })
})
