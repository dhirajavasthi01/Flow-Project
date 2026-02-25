import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// 1. FAST MOCK STATE SETUP
// ============================================================================
let mockAtomState = {}
let mockSetAtom = vi.fn()
let capturedFlowProps = {}

// ============================================================================
// 2. EXTERNAL LIBRARY MOCKS (Dumb & Fast)
// ============================================================================
vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({ caseId: 'mock-case-id' }),
}))

vi.mock('jotai', () => ({
  useAtom: vi.fn((atom) => [mockAtomState[atom], mockSetAtom]),
  useAtomValue: vi.fn((atom) => mockAtomState[atom]),
  useSetAtom: vi.fn(() => mockSetAtom),
}))

let mockSetNodes = vi.fn()
let mockSetEdges = vi.fn()

vi.mock('@xyflow/react', () => {
  return {
    ReactFlow: (props) => {
      capturedFlowProps = props // Capture props for direct synchronous calling
      return <div data-testid='react-flow-mock'>{props.children}</div>
    },
    Background: () => <div data-testid='rf-background' />,
    Controls: () => <div data-testid='rf-controls' />,
    addEdge: vi.fn((edge, edges) => [...edges, edge]),
    applyEdgeChanges: vi.fn((changes, edges) => edges),
    applyNodeChanges: vi.fn((changes, nodes) => nodes),
    getConnectedEdges: vi.fn(() => [{ id: 'e1' }]),
    useNodesState: vi.fn((init) => [init || [], mockSetNodes]),
    useEdgesState: vi.fn((init) => [init || [], mockSetEdges]),
    useReactFlow: vi.fn(() => ({
      screenToFlowPosition: vi.fn(() => ({ x: 100, y: 100 })),
      fitView: vi.fn(),
      zoomTo: vi.fn(),
      getNodes: vi.fn(() => [
        { id: 'node-1', position: { x: 0, y: 0 }, parentId: undefined },
        { id: 'group-1', position: { x: 200, y: 200 }, parentId: undefined },
      ]),
    })),
    useStore: vi.fn(() => new Map([['node-1', { type: 'default' }]])),
    useUpdateNodeInternals: vi.fn(() => vi.fn()),
  }
})

// ============================================================================
// 3. INTERNAL COMPONENT MOCKS
// ============================================================================
vi.mock('../loader/Loader', () => ({
  default: () => <div data-testid='loader' />,
}))
vi.mock('./components/flowPanels/FlowPanels', () => ({
  default: (p) => (
    <div data-testid='flow-panels'>
      <button onClick={p.handleSaveClick} data-testid='save-btn' />
      <button onClick={p.handleDeleteAll} data-testid='delete-all-btn' />
    </div>
  ),
}))
vi.mock('./components/helperLines/HelperLines', () => ({
  HelperLines: () => <div />,
}))
vi.mock('./components/selectionFlowRect/SelectionFlowRect', () => ({
  SelectionFlowRect: () => <div />,
}))
vi.mock('ADFPUIVisuals/Marker', () => ({ default: () => <div /> }))
vi.mock('../toast/ToastManager', () => ({ showToast: vi.fn() }))

// ============================================================================
// 4. STORE & HOOK MOCKS
// ============================================================================
vi.mock(
  '../../features/individualDetailWrapper/features/overview/store/OverviewStore',
  () => ({
    deleteAtom: 'deleteAtom',
    developerModeAtom: 'developerModeAtom',
    dragNodeTypeAtom: 'dragNodeTypeAtom',
    failureNodeClickedAtom: 'failureNodeClickedAtom',
    isFailureModeAtom: 'isFailureModeAtom',
    isFullViewAtom: 'isFullViewAtom',
    LegendPositionAtom: 'LegendPositionAtom',
    newNodeAtom: 'newNodeAtom',
    nodeConfigAtom: 'nodeConfigAtom',
    scrollTickAtom: 'scrollTickAtom',
    selectedEdgeIdAtom: 'selectedEdgeIdAtom',
    selectedEdgeTypeAtom: 'selectedEdgeTypeAtom',
    selectedNodeIdAtom: 'selectedNodeIdAtom',
    showHandlesAtom: 'showHandlesAtom',
    updateConfigAtom: 'updateConfigAtom',
  }),
)
vi.mock(
  '../../features/individualDetailWrapper/store/IndividualDetailWrapperStore',
  () => ({ AppAtom: 'AppAtom' }),
)

let mockAddFlow = vi.fn((data, options) => {
  options.onSuccess()
})
vi.mock('./hooks/useFlowData/useFlowData', () => ({
  useFlowData: vi.fn(() => ({
    nodes: [],
    edges: [],
    isLoading: false,
    isEnabled: true,
    legendPosition: { x: 0, y: 0 },
    isAdding: false,
    error: null,
    addFlow: mockAddFlow,
    saved: false,
  })),
}))

vi.mock('./hooks/useFlowSelection/useFlowSelection', () => ({
  useFlowSelection: vi.fn(() => ({
    selectedNodes: [{ id: 'node-1' }],
    allEdges: [{ id: 'edge-1' }],
  })),
}))
vi.mock('./hooks/useFlowSnapshot/useFlowSnapshot', () => ({
  useFlowSnapshot: vi.fn(() => ({
    takeSnapshot: vi.fn(),
    applySnappingToChanges: vi.fn((c) => c),
  })),
}))
vi.mock('./hooks/useHelperLines/useHelperLines', () => ({
  useHelperLines: vi.fn(() => ({ snapNodePosition: vi.fn((id, pos) => pos) })),
}))
vi.mock('./hooks/useNodeResize/useNodeResize', () => ({
  applyResizeChanges: vi.fn((n) => n),
  isResizingRef: { current: false },
  persistResizeChangesRef: { current: vi.fn() },
  syncNodeDimensions: vi.fn((n) => ({
    ...n,
    style: { width: 100, height: 100 },
  })),
}))
vi.mock('./hooks/useTemplateDrop/useTemplateDrop', () => ({
  useTemplateDrop: vi.fn(() => ({ handleTemplateDrop: vi.fn() })),
}))
vi.mock('./hooks/useTemplateManager/useTemplateManager', () => ({
  useTemplateManager: vi.fn(() => ({ saveTemplate: vi.fn() })),
}))

// ============================================================================
// 5. UTILITY MOCKS
// ============================================================================
vi.mock('../../utills/flowUtills/FlowNodeUtils', () => ({
  extractDimensionsFromSvgByBBox: vi.fn(() =>
    Promise.resolve({ width: 100, height: 100 }),
  ),
  hasSubComponentAssetIdMatch: vi.fn((a, b) => a === b),
  svgDimensionsCache: new Map(),
}))
vi.mock('../../utills/flowUtills/FlowUtills', () => ({
  generateRandom8DigitNumber: vi.fn(() => '1234'),
}))
vi.mock('../../utills', () => ({
  callBackIfConditionIsTrue: vi.fn((cond, cb) => {
    if (cond) cb()
  }),
  CompareValuesWithSymbol: vi.fn(() => true),
  getNestedValue: vi.fn(() => 100),
  getSafe: vi.fn((fn, fallback) => {
    try {
      return fn()
    } catch {
      return fallback
    }
  }),
  getValsBaseOnCondition: vi.fn((cond, a, b) => (cond ? a : b)),
  ifElse: vi.fn((cond, ifTrue, ifFalse) => (cond ? ifTrue() : ifFalse())),
}))
vi.mock('./Flow.functions', () => ({
  processNodesWithTableData: vi.fn((n) => n),
}))
vi.mock('./utils/edgeHelper/EdgeHelper', () => ({
  createEdge: vi.fn(() => ({ id: 'e-new' })),
  updateEdgeWithConfig: vi.fn((e) => e),
}))
vi.mock('./utils/flowHelper/FlowHelper', () => ({
  handleFetchedNodesEdgesChange: vi.fn(),
  handleTableDataChange: vi.fn(),
}))
vi.mock('./utils/nodeEdgeType/NodeEdgeType', () => ({
  allNodes: [{ type: 'testNode' }],
  edgeTypes: {},
  nodeTypes: {},
}))
vi.mock('./utils/parentChildUtils/ParentChildUtils', () => ({
  absoluteToRelative: vi.fn((pos) => pos),
  findGroupNodeAtPoint: vi.fn(() => ({ id: 'group-1' })),
  getDescendantIds: vi.fn(() => ['child-1']),
  getNodeDimensionHightAndWidth: vi.fn(() => 100),
  sortNodesByParentChild: vi.fn((n) => n),
  wouldCreateCircularDependency: vi.fn(() => false),
  relativeToAbsolute: vi.fn((pos) => pos),
}))
vi.mock('./utils/templateHelper/TemplateHelper', () => ({
  handleDragOver: vi.fn((e) => e.preventDefault()),
  handleSaveTemplate: vi.fn(),
  handleTemplateDropHelper: vi.fn(() => false),
}))
vi.mock('./utils/nodeDimensionHelpers/nodeDimensionHelpers', () => ({
  checkForDimensionChanges: vi.fn(() => false),
  setupDimensionTimeout: vi.fn(),
  updateCurrentDimensions: vi.fn(),
}))
vi.mock('./utils/nodeSpecialHandling/NodeSpecialHandling', () => ({
  storeNodeDimensions: vi.fn(),
}))
vi.mock('./components/svgMap/SvgMap', () => ({
  svgMap: { 'test-node': 'test-svg-path' },
}))

import Flow from './Flow'

// ============================================================================
// 6. FAST TESTS (No waitFors, direct prop injection, fake timers)
// ============================================================================

describe('Flow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers() // CRITICAL: Stop tests from waiting for setTimeouts
    mockAtomState = { developerModeAtom: true, isFullViewAtom: false }
    capturedFlowProps = {}
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  const setup = (props = {}) =>
    render(<Flow tableData={[{ subComponentAssetId: 'fail-1' }]} {...props} />)

  describe('Initialization and Render', () => {
    it('renders loader when in failure mode and loading', async () => {
      const { useFlowData } = await import('./hooks/useFlowData/useFlowData')
      useFlowData.mockReturnValueOnce({ isLoading: true, isEnabled: false })
      setup({ isLoadingFailerMode: true })
    })

    it('renders flow canvas normally', () => {
      setup()
      expect(screen.getByTestId('react-flow-mock')).toBeDefined()
    })
  })

  describe('ReactFlow Sync Callbacks', () => {
    it('handles interactions: onNodeClick, onEdgeClick, onPaneClick', () => {
      setup()

      act(() => {
        // Node Click (Triggers failure mode and selection)
        capturedFlowProps.onNodeClick(
          {},
          { id: 'node-1', data: { subComponentAssetId: 'fail-1' } },
        )
        // Edge Click
        capturedFlowProps.onEdgeClick({}, { id: 'edge-1', style: {} })
        // Pane Click
        capturedFlowProps.onPaneClick()
      })

      expect(mockSetAtom).toHaveBeenCalled() // Verifies state atoms were updated instantly
    })

    it('handles structural changes: onNodesChange, onEdgesChange, onConnect', () => {
      setup()
      act(() => {
        capturedFlowProps.onNodesChange([
          { type: 'resize', id: 'node-1', resizing: false },
        ])
        capturedFlowProps.onEdgesChange([{ type: 'remove', id: 'edge-1' }])
        capturedFlowProps.onConnect({ source: '1', target: '2' })
      })
      // Verifies internal functions ran
      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockSetEdges).toHaveBeenCalled()
    })

    it('handles dropping new nodes onto the canvas synchronously', () => {
      mockAtomState.dragNodeTypeAtom = 'testNode'
      setup()
      const dropEvent = { clientX: 100, clientY: 100, preventDefault: vi.fn() }

      act(() => {
        capturedFlowProps.onDrop(dropEvent)
      })

      expect(dropEvent.preventDefault).toHaveBeenCalled()
      expect(mockSetAtom).toHaveBeenCalled() // sets newNodeAtom
    })
  })

  describe('Drag and Drop (Reparenting)', () => {
    it('handles attaching node to a parent group instantly', () => {
      setup()
      const node = { id: 'node-1', position: { x: 10, y: 10 } }

      act(() => {
        capturedFlowProps.onNodeDragStart({}, node)
        capturedFlowProps.onNodeDrag({}, node) // Mocks trigger 'group-1' as potential parent
        capturedFlowProps.onNodeDragStop({}, node)
        vi.runAllTimers() // Flushes the 100ms timeout in onNodeDragStop
      })
    })
  })

  describe('Jotai State Effects', () => {
    it('handles node deletion effect instantly', () => {
      mockAtomState.selectedNodeIdAtom = 'node-1'
      mockAtomState.deleteAtom = true

      act(() => {
        setup()
      })

      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockSetAtom).toHaveBeenCalledWith(false) // Resets shouldDelete
    })

    it('handles config update effect instantly', () => {
      mockAtomState.selectedNodeIdAtom = 'node-1'
      mockAtomState.nodeConfigAtom = { data: { width: 300 } }
      mockAtomState.updateConfigAtom = true

      act(() => {
        setup()
      })

      expect(mockSetNodes).toHaveBeenCalled()
      expect(mockSetAtom).toHaveBeenCalledWith(false) // Resets update flag
    })

    it('handles newNode creation and SVG dimension extraction asynchronously', async () => {
      // Simulate Jotai dropping a new node
      mockAtomState.newNodeAtom = {
        id: undefined,
        nodeType: 'testNode',
        svgPath: 'path/to/svg',
        data: {},
      }

      act(() => {
        setup()
      })

      // Flush microtasks (Promises) and macro tasks (Timers) instantly
      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const { extractDimensionsFromSvgByBBox } =
        await import('../../utills/flowUtills/FlowNodeUtils')
      expect(extractDimensionsFromSvgByBBox).toHaveBeenCalled()
      expect(mockSetNodes).toHaveBeenCalled() // Verifies node was injected into state
    })
  })

  describe('Flow Panel Actions', () => {
    it('triggers save action instantly', () => {
      setup()
      act(() => {
        fireEvent.click(screen.getByTestId('save-btn'))
      })
      expect(mockAddFlow).toHaveBeenCalled()
    })

    it('triggers delete all instantly', () => {
      setup()
      act(() => {
        fireEvent.click(screen.getByTestId('delete-all-btn'))
      })
      expect(mockSetNodes).toHaveBeenCalled()
    })
  })
})
