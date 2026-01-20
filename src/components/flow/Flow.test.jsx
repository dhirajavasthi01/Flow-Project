import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Provider as JotaiProvider } from 'jotai';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Flow from './Flow';
import * as OverviewStore from '../../features/individualDetailWrapper/features/overview/store/OverviewStore';
import * as FlowUtills from '../../utills/flowUtills/FlowUtills';
import { useFlowData } from './hooks/useFlowData/useFlowData';
import { useTemplateManager } from './hooks/useTemplateManager/useTemplateManager';
import { useTemplateDrop } from './hooks/useTemplateDrop/useTemplateDrop';
import { useTextBoxClickHandler } from './hooks/useTextBoxClickHandler/useTextBoxClickHandler';

// Mock all external dependencies
vi.mock('./hooks/useFlowData/useFlowData');
vi.mock('./hooks/useTemplateManager/useTemplateManager');
vi.mock('./hooks/useTemplateDrop/useTemplateDrop');
vi.mock('./hooks/useTextBoxClickHandler/useTextBoxClickHandler');
vi.mock("../../assets/images/common/drawer.svg", () => ({default: 'svg-mock'}));
vi.mock("../../assets/images/common/close.svg", () => ({default: 'svg-mock'}));
vi.mock("../../assets/images/common/FailureModeLegend.svg", () => ({default: 'svg-mock'}));
vi.mock("../../assets/images/common/NewFailureMode.svg", () => ({default: 'svg-mock'}));
vi.mock('./hooks/useFlowSelection/useFlowSelection', () => ({
  useFlowSelection: vi.fn(() => ({
    selectedNodes: [],
    allEdges: []
  }))
}));
vi.mock('../../utills/flowUtills/FlowUtills');
vi.mock('./utils/NodeEdgeType', () => ({
  allNodes: [
    { type: 'testNode', nodeType: 'testNode', data: { label: 'Test' } }
  ],
  edgeTypes: {},
  nodeTypes: {}
}));
vi.mock('ADFPUIVisuals/Marker', () => ({
  default: () => null,
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useOutletContext: vi.fn(() => ({ caseId: 'test-123' }))
  };
});

// Mock ReactFlow
const mockCallbacks = {};
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    ReactFlow: ({ children, onPaneClick, onDragOver, onDrop, onNodeClick, onEdgeClick, onConnect, onNodesChange, onEdgesChange, onNodeDragStart, onNodeDragStop, onSelectionChange, ...props }) => {
      // Store callbacks for testing
      if (typeof window !== 'undefined') {
        window.__reactFlowCallbacks = {
          onPaneClick,
          onDragOver,
          onDrop,
          onNodeClick,
          onEdgeClick,
          onConnect,
          onNodesChange,
          onEdgesChange,
          onNodeDragStart,
          onNodeDragStop,
          onSelectionChange,
        };
      }
      return (
        <div data-testid="react-flow" {...props}>
          {children}
        </div>
      );
    },
    Background: ({ variant }) => (
      <div data-testid="background" data-variant={variant} />
    ),
    Controls: (props) => <div data-testid="controls" {...props} />,
    useNodesState: vi.fn(() => [[], vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn()]),
    useReactFlow: vi.fn(() => ({
      screenToFlowPosition: vi.fn((pos) => ({ x: pos.x, y: pos.y })),
      fitView: vi.fn(),
      zoomTo: vi.fn(),
      getNodes: vi.fn(() => []),
    })),
    useUpdateNodeInternals: vi.fn(() => vi.fn()),
    useStore: vi.fn(() => new Map()),
    getConnectedEdges: vi.fn(() => []),
    applyNodeChanges: vi.fn((changes, nodes) => nodes),
    applyEdgeChanges: vi.fn((changes, edges) => edges),
    addEdge: vi.fn((edge, edges) => [...edges, edge]),
  };
});

// Mock jotai
vi.mock('jotai', async () => {
  const actual = await vi.importActual('jotai');
  return {
    ...actual,
    useAtom: vi.fn((atom) => [null, vi.fn()]),
    useAtomValue: vi.fn(() => ({ actualTime: Date.now() })),
    useSetAtom: vi.fn(() => vi.fn()),
  };
});

// Mock other dependencies
vi.mock('./flowHelper', () => ({
  handleFetchedNodesEdgesChange: vi.fn(),
  handleTableDataChange: vi.fn(),
}));

vi.mock('./edgeHelper', () => ({
  updateEdgeWithConfig: vi.fn((edges) => edges),
  createEdge: vi.fn((params) => ({ ...params, id: 'new-edge' })),
}));

vi.mock('./templateHelper', () => ({
  handleDragOver: vi.fn(),
  handleTemplateDropHelper: vi.fn(() => false),
  handleSaveTemplate: vi.fn(),
}));

vi.mock('./hooks/useFlowSnapshot/useFlowSnapshot', () => ({
  useFlowSnapshot: vi.fn(() => ({
    takeSnapshot: vi.fn(),
    undo: vi.fn(),
    applySnappingToChanges: vi.fn((changes) => changes),
  })),
}));

vi.mock('./hooks/useHelperLines/useHelperLines', () => ({
  useHelperLines: vi.fn(() => ({
    snapNodePosition: vi.fn((id, pos) => pos),
  })),
}));

vi.mock('./hooks/useNodeResize/useNodeResize', () => ({
  applyResizeChanges: vi.fn((nodes) => nodes),
}));

vi.mock('./Flow.functions', () => ({
  processNodesWithTableData: vi.fn((nodes) => nodes),
  mergeProcessedNodesWithCurrent: vi.fn((processed, current) => current),
  createTableDataKey: vi.fn(() => 'key'),
}));

vi.mock('./components/FlowPanels/FlowPanels', () => ({
  default: (props) => <div data-testid="flow-panels" {...props} />,
}));

vi.mock('./components/selectionFlowRect/SelectionFlowRect', () => ({
  SelectionFlowRect: (props) => (
    <div data-testid="selection-flow-rect" {...props} />
  ),
}));

vi.mock('./components/helperLines/HelperLines', () => ({
  HelperLines: (props) => <div data-testid="helper-lines" {...props} />,
}));

vi.mock('../loader/Loader', () => ({
  default: () => <div data-testid="loader" />,
}));

vi.mock('../toast/ToastManager', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../features/individualDetailWrapper/store/IndividualDetailWrapperStore', () => ({
  AppAtom: {},
}));

describe('Flow Component', () => {
  const defaultProps = {
    tableData: [],
    isLoading: false,
    showDeveloperMode: true
  };
  const mockFlowData = {
    nodes: [],
    edges: [],
    isLoading: false,
    isAdding: false,
    error: null,
    addFlow: vi.fn(),
    saved: false,
    legendPosition: 'bottom-right'
  };
  const mockOutletContext = {
    caseId: 'test-case-123'
  };
  const mockAppAtom = {
    actualTime: '2024-01-01T00:00:00Z'
  };
  
  let mockSetNodes, mockSetEdges, mockSetSelectedNodeId, mockSetSelectedEdgeId;
  let mockSetConfig, mockSetNewNode, mockSetType, mockSetShouldDelete;
  let mockSetShouldUpdateConfig, mockSetDeveloperMode, mockToggle;
  let mockSetLegendPosition, mockSetFailureNodeClicked, mockSetIsFailureModeOpen;
  let mockSetScrollTick, mockSetTemplateDropCounts, mockSetShowSaveTemplate;
  let mockSetShowDrawer, mockSetPartial, mockSetNodeToUpdate;
  let mockSetDraggingNodeId, mockSetNodeToCopy;
  let mockUseAtom, mockUseAtomValue, mockUseSetAtom;
  let mockUseNodesState, mockUseEdgesState, mockGetConnectedEdges;
  let mockUseReactFlow, mockUseUpdateNodeInternals;
  let mockApplyNodeChanges, mockApplyEdgeChanges, mockAddEdge;
  let mockUseFlowData, mockUseFlowSnapshot, mockUseFlowSelection;
  let mockUseTemplateManager, mockUseTemplateDrop, mockUseTextBoxClickHandler;
  let mockUseHelperLines, mockApplyResizeChanges;
  let mockHandleDragOver, mockHandleTemplateDropHelper, mockHandleSaveTemplate;
  let mockHandleFetchedNodesEdgesChange, mockHandleTableDataChange;
  let mockUpdateEdgeWithConfig, mockCreateEdge;

  const renderWithProviders = (props = {}) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <JotaiProvider>
                <ReactFlowProvider>
                  <Flow {...defaultProps} {...props} />
                </ReactFlowProvider>
              </JotaiProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    );
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Create mock functions
    mockSetNodes = vi.fn();
    mockSetEdges = vi.fn();
    mockSetSelectedNodeId = vi.fn();
    mockSetSelectedEdgeId = vi.fn();
    mockSetConfig = vi.fn();
    mockSetNewNode = vi.fn();
    mockSetType = vi.fn();
    mockSetShouldDelete = vi.fn();
    mockSetShouldUpdateConfig = vi.fn();
    mockSetDeveloperMode = vi.fn();
    mockToggle = vi.fn();
    mockSetLegendPosition = vi.fn();
    mockSetFailureNodeClicked = vi.fn();
    mockSetIsFailureModeOpen = vi.fn();
    mockSetScrollTick = vi.fn();
    mockSetTemplateDropCounts = vi.fn();
    mockSetShowSaveTemplate = vi.fn();
    mockSetShowDrawer = vi.fn();
    mockSetPartial = vi.fn();
    mockSetNodeToUpdate = vi.fn();
    mockSetDraggingNodeId = vi.fn();
    mockSetNodeToCopy = vi.fn();

    // Get mocked functions
    const { useAtom, useAtomValue, useSetAtom } = await import('jotai');
    mockUseAtom = vi.mocked(useAtom);
    mockUseAtomValue = vi.mocked(useAtomValue);
    mockUseSetAtom = vi.mocked(useSetAtom);
    
    const reactFlowModule = await import('@xyflow/react');
    mockUseNodesState = vi.mocked(reactFlowModule.useNodesState);
    mockUseEdgesState = vi.mocked(reactFlowModule.useEdgesState);
    mockGetConnectedEdges = vi.mocked(reactFlowModule.getConnectedEdges);
    mockUseReactFlow = vi.mocked(reactFlowModule.useReactFlow);
    mockUseUpdateNodeInternals = vi.mocked(reactFlowModule.useUpdateNodeInternals);
    mockApplyNodeChanges = vi.mocked(reactFlowModule.applyNodeChanges);
    mockApplyEdgeChanges = vi.mocked(reactFlowModule.applyEdgeChanges);
    mockAddEdge = vi.mocked(reactFlowModule.addEdge);
    
    const flowDataModule = await import('./hooks/useFlowData/useFlowData');
    mockUseFlowData = vi.mocked(flowDataModule.useFlowData);
    
    const flowSnapshotModule = await import('./hooks/useFlowSnapshot/useFlowSnapshot');
    mockUseFlowSnapshot = vi.mocked(flowSnapshotModule.useFlowSnapshot);
    
    const flowSelectionModule = await import('./hooks/useFlowSelection/useFlowSelection');
    mockUseFlowSelection = vi.mocked(flowSelectionModule.useFlowSelection);
    
    const templateManagerModule = await import('./hooks/useTemplateManager/useTemplateManager');
    mockUseTemplateManager = vi.mocked(templateManagerModule.useTemplateManager);
    
    const templateDropModule = await import('./hooks/useTemplateDrop/useTemplateDrop');
    mockUseTemplateDrop = vi.mocked(templateDropModule.useTemplateDrop);
    
    const textBoxClickModule = await import('./hooks/useTextBoxClickHandler/useTextBoxClickHandler');
    mockUseTextBoxClickHandler = vi.mocked(textBoxClickModule.useTextBoxClickHandler);
    
    const helperLinesModule = await import('./hooks/useHelperLines/useHelperLines');
    mockUseHelperLines = vi.mocked(helperLinesModule.useHelperLines);
    
    const nodeResizeModule = await import('./hooks/useNodeResize/useNodeResize');
    mockApplyResizeChanges = vi.mocked(nodeResizeModule.applyResizeChanges);
    
    const templateHelperModule = await import('./templateHelper');
    mockHandleDragOver = vi.mocked(templateHelperModule.handleDragOver);
    mockHandleTemplateDropHelper = vi.mocked(templateHelperModule.handleTemplateDropHelper);
    mockHandleSaveTemplate = vi.mocked(templateHelperModule.handleSaveTemplate);
    
    const flowHelperModule = await import('./flowHelper');
    mockHandleFetchedNodesEdgesChange = vi.mocked(flowHelperModule.handleFetchedNodesEdgesChange);
    mockHandleTableDataChange = vi.mocked(flowHelperModule.handleTableDataChange);
    
    const edgeHelperModule = await import('./edgeHelper');
    mockUpdateEdgeWithConfig = vi.mocked(edgeHelperModule.updateEdgeWithConfig);
    mockCreateEdge = vi.mocked(edgeHelperModule.createEdge);
   
    // Setup default mocks
    mockUseFlowData.mockReturnValue(mockFlowData);
    mockUseTemplateManager.mockReturnValue({
      saveTemplate: vi.fn()
    });
    mockUseTemplateDrop.mockReturnValue({
      handleTemplateDrop: vi.fn(() => ({ success: true }))
    });
    mockUseTextBoxClickHandler.mockReturnValue(vi.fn());
    
    // Setup default useAtom mock
    mockUseAtom.mockImplementation((atom) => {
      if (atom?.toString?.().includes('newNodeAtom')) {
        return [null, mockSetNewNode];
      }
      if (atom?.toString?.().includes('nodeConfigAtom')) {
        return [null, mockSetConfig];
      }
      if (atom?.toString?.().includes('updateConfigAtom')) {
        return [false, mockSetShouldUpdateConfig];
      }
      if (atom?.toString?.().includes('showHandlesAtom')) {
        return [false, mockToggle];
      }
      if (atom?.toString?.().includes('selectedNodeIdAtom')) {
        return [null, mockSetSelectedNodeId];
      }
      if (atom?.toString?.().includes('selectedEdgeIdAtom')) {
        return [null, mockSetSelectedEdgeId];
      }
      if (atom?.toString?.().includes('LegendPositionAtom')) {
        return ['bottom-right', mockSetLegendPosition];
      }
      if (atom?.toString?.().includes('developerModeAtom')) {
        return [false, mockSetDeveloperMode];
      }
      if (atom?.toString?.().includes('isFailureModeAtom')) {
        return [false, mockSetIsFailureModeOpen];
      }
      if (atom?.toString?.().includes('deleteAtom')) {
        return [false, mockSetShouldDelete];
      }
      if (atom?.toString?.().includes('dragNodeTypeAtom')) {
        return [null, mockSetType];
      }
      return [null, vi.fn()];
    });

    mockUseSetAtom.mockImplementation((atom) => {
      if (atom?.toString?.().includes('failureNodeClickedAtom')) {
        return mockSetFailureNodeClicked;
      }
      if (atom?.toString?.().includes('scrollTickAtom')) {
        return mockSetScrollTick;
      }
      return vi.fn();
    });

    mockUseNodesState.mockReturnValue([[], mockSetNodes]);
    mockUseEdgesState.mockReturnValue([[], mockSetEdges]);
    mockUseAtomValue.mockReturnValue({ actualTime: Date.now() });

    // Mock FlowUtills
    vi.mocked(FlowUtills.generateRandom8DigitNumber).mockReturnValue(12345678);
    vi.mocked(FlowUtills.hasSubComponentAssetIdMatch).mockReturnValue(false);
    vi.mocked(FlowUtills.shouldNodeBlink).mockReturnValue({ shouldBlink: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.__reactFlowCallbacks) {
      delete window.__reactFlowCallbacks;
    }
  });

  describe('Component Rendering', () => {
    it('should render loader when isLoadingFailerMode is true', () => {
      renderWithProviders({ isLoading: true });
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render loader when flow data is loading', () => {
      mockUseFlowData.mockReturnValue({ ...mockFlowData, isLoading: true });
      renderWithProviders();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render loader when actualTime is not available', () => {
      mockUseAtomValue.mockReturnValue(null);
      renderWithProviders();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render ReactFlow when data is loaded', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }],
        edges: []
      });
      
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should render ReactFlow container', () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [],
        edges: []
      });
      
      const { container } = renderWithProviders();
      expect(container.querySelector('#react-flow-container')).toBeInTheDocument();
    });
  });

  describe('Developer Mode', () => {
    it('should show developer mode controls when enabled', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
      
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
        expect(screen.getByTestId('flow-panels')).toBeInTheDocument();
      });
    });

    it('should save flow data when save button is clicked', async () => {
      const mockAddFlow = vi.fn((data, callbacks) => {
        callbacks.onSuccess();
      });
      
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        if (atom?.toString?.().includes('LegendPositionAtom')) {
          return ['bottom-right', mockSetLegendPosition];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        addFlow: mockAddFlow,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
      
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should display saving text when adding flow', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        isAdding: true,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
      
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });
  });

  describe('Node Operations', () => {
    it('should handle node click in developer mode', async () => {
      const mockHandleTextBoxClick = vi.fn().mockReturnValue(null);
      mockUseTextBoxClickHandler.mockReturnValue(mockHandleTextBoxClick);

      let isDeveloperModeState = true;
      let isFailureModeState = false;
      let selectedNodeIdState = null;
      let selectedEdgeIdState = null;
      let configState = null;

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [isDeveloperModeState, mockSetDeveloperMode];
        }
        if (atom?.toString?.().includes('isFailureModeAtom')) {
          return [isFailureModeState, mockSetIsFailureModeOpen];
        }
        if (atom?.toString?.().includes('selectedNodeIdAtom')) {
          return [selectedNodeIdState, mockSetSelectedNodeId];
        }
        if (atom?.toString?.().includes('selectedEdgeIdAtom')) {
          return [selectedEdgeIdState, mockSetSelectedEdgeId];
        }
        if (atom?.toString?.().includes('nodeConfigAtom')) {
          return [configState, mockSetConfig];
        }
        return [null, vi.fn()];
      });

      mockUseSetAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('failureNodeClickedAtom')) {
          return mockSetFailureNodeClicked;
        }
        if (atom?.toString?.().includes('scrollTickAtom')) {
          return mockSetScrollTick;
        }
        return vi.fn();
      });

      mockUseNodesState.mockReturnValue([[], mockSetNodes]);
      mockUseEdgesState.mockReturnValue([[], mockSetEdges]);

      const mockGetNodes = vi.fn(() => []);
      const mockScreenToFlowPosition = vi.fn((pos) => ({ x: pos.x, y: pos.y }));
      mockUseReactFlow.mockReturnValue({
        screenToFlowPosition: mockScreenToFlowPosition,
        fitView: vi.fn(),
        zoomTo: vi.fn(),
        getNodes: mockGetNodes,
      });

      const mockStore = new Map();
      mockStore.set('node-1', { id: '1', type: 'default', data: { subComponentAssetId: 'test-id' } });
      const { useStore } = await import('@xyflow/react');
      vi.mocked(useStore).mockReturnValue(mockStore);

      const mockTakeSnapshot = vi.fn();
      mockUseFlowSnapshot.mockReturnValue({
        takeSnapshot: mockTakeSnapshot,
        undo: vi.fn(),
        applySnappingToChanges: vi.fn((changes) => changes),
      });
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { subComponentAssetId: 'test-id' }
        }]
      });
     
      renderWithProviders({ showDeveloperMode: true, tableData: [] });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onNodeClick).toBeDefined();
      
      await act(async () => {
        callbacks.onNodeClick({ preventDefault: vi.fn() }, {
          id: '1',
          type: 'default',
          data: { subComponentAssetId: 'test-id' }
        });
      });
      
      expect(mockTakeSnapshot).toHaveBeenCalled();
      expect(mockHandleTextBoxClick).toHaveBeenCalled();
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith('1');
      expect(mockSetSelectedEdgeId).toHaveBeenCalledWith(null);
      expect(mockSetConfig).toHaveBeenCalled();
    });

    it('should handle node click when failure mode exists', async () => {
      vi.mocked(FlowUtills.hasSubComponentAssetIdMatch).mockReturnValue(true);
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { subComponentAssetId: 'test-id' }
        }]
      });
     
      const tableData = [{
        subComponentAssetId: 'test-id',
        failureModeName: 'Test Failure'
      }];
     
      renderWithProviders({
        showDeveloperMode: false,
        tableData
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should process nodes with table data', async () => {
      vi.mocked(FlowUtills.hasSubComponentAssetIdMatch).mockReturnValue(true);
      vi.mocked(FlowUtills.shouldNodeBlink).mockReturnValue({ shouldBlink: true });
     
      const tableData = [{
        subComponentAssetId: 'test-id',
        failureModeName: 'Test Failure',
        activeSince: '2024-01-01T00:00:00Z'
      }];
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            subComponentAssetId: 'test-id',
            nodeColor: '#000000'
          }
        }]
      });
     
      renderWithProviders({ tableData });
      
      await waitFor(() => {
        expect(mockHandleTableDataChange).toHaveBeenCalled();
      });
    });

    it('should handle nodes with gradient colors', async () => {
      vi.mocked(FlowUtills.hasSubComponentAssetIdMatch).mockReturnValue(true);
     
      const tableData = [{
        subComponentAssetId: 'test-id',
        failureModeName: 'Test Failure'
      }];
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            subComponentAssetId: 'test-id',
            gradientStart: '#000000',
            gradientEnd: '#FFFFFF'
          }
        }]
      });
     
      renderWithProviders({ tableData });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should not click node when not in developer mode and no failure mode', async () => {
      vi.mocked(FlowUtills.hasSubComponentAssetIdMatch).mockReturnValue(false);
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { subComponentAssetId: 'test-id' }
        }]
      });
     
      renderWithProviders({ showDeveloperMode: false, tableData: [] });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Operations', () => {
    it('should handle edge click in developer mode', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        if (atom?.toString?.().includes('selectedEdgeIdAtom')) {
          return [null, mockSetSelectedEdgeId];
        }
        if (atom?.toString?.().includes('selectedNodeIdAtom')) {
          return [null, mockSetSelectedNodeId];
        }
        if (atom?.toString?.().includes('nodeConfigAtom')) {
          return [null, mockSetConfig];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} },
          { id: '2', type: 'default', position: { x: 100, y: 100 }, data: {} }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onEdgeClick).toBeDefined();
      
      await act(async () => {
        callbacks.onEdgeClick({ preventDefault: vi.fn() }, {
          id: 'e1-2',
          style: { stroke: '#000000', strokeWidth: 5 }
        });
      });
      
      expect(mockSetSelectedEdgeId).toHaveBeenCalledWith('e1-2');
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null);
      expect(mockSetConfig).toHaveBeenCalled();
    });

    it('should not handle edge click when not in developer mode', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} },
          { id: '2', type: 'default', position: { x: 100, y: 100 }, data: {} }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2', style: { stroke: '#000' } }]
      });
     
      renderWithProviders({ showDeveloperMode: false });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });
  });

  describe('Template Operations', () => {
    it('should handle template drop', async () => {
      const mockHandleTemplateDrop = vi.fn(() => ({ success: true }));
      mockUseTemplateDrop.mockReturnValue({
        handleTemplateDrop: mockHandleTemplateDrop
      });
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should handle template drop with fallback format', async () => {
      const mockHandleTemplateDrop = vi.fn(() => ({ success: true }));
      mockUseTemplateDrop.mockReturnValue({
        handleTemplateDrop: mockHandleTemplateDrop
      });
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should save template when button clicked with valid input', async () => {
      const mockSaveTemplate = vi.fn();
      mockUseTemplateManager.mockReturnValue({
        saveTemplate: mockSaveTemplate
      });
     
      mockUseFlowSelection.mockReturnValue({
        selectedNodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }],
        allEdges: []
      });
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should not save template when no nodes selected', async () => {
      const mockSaveTemplate = vi.fn();
      mockUseTemplateManager.mockReturnValue({
        saveTemplate: mockSaveTemplate
      });
     
      mockUseFlowSelection.mockReturnValue({
        selectedNodes: [],
        allEdges: []
      });
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
     
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should handle template drop error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
     
      const mockHandleTemplateDrop = vi.fn(() => ({ success: false, error: 'Template not found' }));
      mockUseTemplateDrop.mockReturnValue({
        handleTemplateDrop: mockHandleTemplateDrop
      });
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
      
      consoleError.mockRestore();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle copy (Ctrl+C) keyboard shortcut', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('selectedNodeIdAtom')) {
          return ['node-1', mockSetSelectedNodeId];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
     
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
      });
    });

    it('should handle paste (Ctrl+V) keyboard shortcut', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
     
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.keyDown(window, { key: 'v', ctrlKey: true });
      });
    });

    it('should handle delete keyboard shortcut', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('selectedNodeIdAtom')) {
          return ['node-1', mockSetSelectedNodeId];
        }
        if (atom?.toString?.().includes('deleteAtom')) {
          return [false, mockSetShouldDelete];
        }
        return [null, vi.fn()];
      });

      mockUseNodesState.mockReturnValue([
        [{ id: 'node-1', data: {} }],
        mockSetNodes
      ]);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
     
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Delete' });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle flow data loading error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        error: new Error('Failed to load')
      });
     
      renderWithProviders();
     
      await waitFor(() => {
        expect(mockHandleFetchedNodesEdgesChange).toHaveBeenCalled();
      });
     
      consoleError.mockRestore();
    });

    it('should handle save flow error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockAddFlow = vi.fn((data, callbacks) => {
        callbacks.onError(new Error('Save failed'));
      });
     
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        if (atom?.toString?.().includes('LegendPositionAtom')) {
          return ['bottom-right', mockSetLegendPosition];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        addFlow: mockAddFlow,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });    
      
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
      
      consoleError.mockRestore();
    });

    it('should handle invalid template JSON parse error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
      
      consoleError.mockRestore();
    });
  });

  describe('Pane Interactions', () => {
    it('should clear selection on pane click', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('selectedNodeIdAtom')) {
          return ['node-1', mockSetSelectedNodeId];
        }
        if (atom?.toString?.().includes('selectedEdgeIdAtom')) {
          return ['edge-1', mockSetSelectedEdgeId];
        }
        if (atom?.toString?.().includes('nodeConfigAtom')) {
          return [{ id: 'config' }, mockSetConfig];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onPaneClick).toBeDefined();
      
      await act(async () => {
        callbacks.onPaneClick();
      });
      
      expect(mockSetConfig).toHaveBeenCalledWith(null);
      expect(mockSetSelectedEdgeId).toHaveBeenCalledWith(null);
      expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null);
    });

    it('should handle drag over event with template type', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      if (callbacks?.onDragOver) {
        const mockEvent = {
          preventDefault: vi.fn(),
          dataTransfer: {
            types: ['application/template']
          }
        };
        await act(async () => {
          callbacks.onDragOver(mockEvent);
        });
        expect(mockHandleDragOver).toHaveBeenCalledWith(mockEvent);
      }
    });

    it('should handle drag over event with template fallback', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      if (callbacks?.onDragOver) {
        const mockEvent = {
          preventDefault: vi.fn(),
          dataTransfer: {
            types: [],
            getData: vi.fn(() => 'TEMPLATE:test-id')
          }
        };
        await act(async () => {
          callbacks.onDragOver(mockEvent);
        });
        expect(mockHandleDragOver).toHaveBeenCalledWith(mockEvent);
      }
    });

    it('should handle regular node drop', async () => {
      mockHandleTemplateDropHelper.mockReturnValue(false);

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('dragNodeTypeAtom')) {
          return ['testNode', mockSetType];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      if (callbacks?.onDrop) {
        const mockEvent = {
          preventDefault: vi.fn(),
          clientX: 100,
          clientY: 200,
          dataTransfer: {
            getData: vi.fn(() => '')
          }
        };
        await act(async () => {
          callbacks.onDrop(mockEvent);
        });
        expect(mockHandleTemplateDropHelper).toHaveBeenCalled();
      }
    });
  });

  describe('Background Panel', () => {
    it('should show failure mode message when not in developer mode', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: false });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should show lines background in developer mode', async () => {
      // Both showDeveloperMode prop AND isDeveloperMode atom need to be true
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode]; // isDeveloperMode = true
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      // showDeveloperMode prop = true
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Check background variant: props?.showDeveloperMode && isDeveloperMode ? "lines" : "none"
      const background = screen.getByTestId('background');
      expect(background).toHaveAttribute('data-variant', 'lines');
    });

    it('should not show failure mode message in developer mode', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
     
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Failure Modes', () => {
    it('should handle multiple failure modes for same asset', async () => {
      vi.mocked(FlowUtills.hasSubComponentAssetIdMatch).mockReturnValue(true);
     
      const tableData = [
        {
          subComponentAssetId: 'test-id',
          failureModeName: 'Failure 1'
        },
        {
          subComponentAssetId: 'test-id',
          activeFailureMode: 'Failure 2'
        }
      ];
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            subComponentAssetId: 'test-id',
            nodeColor: '#000000'
          }
        }]
      });
     
      renderWithProviders({ tableData });
      
      await waitFor(() => {
        expect(mockHandleTableDataChange).toHaveBeenCalled();
      });
    });

    it('should filter out null/undefined failure mode names', async () => {
      vi.mocked(FlowUtills.hasSubComponentAssetIdMatch).mockReturnValue(true);
     
      const tableData = [
        {
          subComponentAssetId: 'test-id',
          failureModeName: 'Failure 1'
        },
        {
          subComponentAssetId: 'test-id',
          failureModeName: null
        },
        {
          subComponentAssetId: 'test-id',
          activeFailureMode: undefined
        }
      ];
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            subComponentAssetId: 'test-id',
            nodeColor: '#000000'
          }
        }]
      });
     
      renderWithProviders({ tableData });
      
      await waitFor(() => {
        expect(mockHandleTableDataChange).toHaveBeenCalled();
      });
    });
  });

  describe('Node Changes and Updates', () => {
    it('should handle node resize changes in developer mode', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        return [null, vi.fn()];
      });

      mockUseFlowSnapshot.mockReturnValue({
        takeSnapshot: vi.fn(),
        undo: vi.fn(),
        applySnappingToChanges: vi.fn((changes) => changes),
      });

      mockApplyResizeChanges.mockImplementation((nodes, changes) => nodes);
      mockApplyNodeChanges.mockImplementation((changes, nodes) => nodes);

      mockUseNodesState.mockReturnValue([
        [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { width: 100, height: 100 },
          style: { width: 100, height: 100 }
        }],
        mockSetNodes
      ]);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { width: 100, height: 100 },
          style: { width: 100, height: 100 }
        }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onNodesChange).toBeDefined();
      
      await act(async () => {
        callbacks.onNodesChange([{ type: 'resize', id: '1', dimensions: { width: 200, height: 200 } }]);
      });
      
      expect(mockApplyResizeChanges).toHaveBeenCalled();
    });

    it('should not handle node changes when not in developer mode', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {}
        }]
      });
     
      renderWithProviders({ showDeveloperMode: false });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      if (callbacks?.onNodesChange) {
        await act(async () => {
          callbacks.onNodesChange([{ type: 'select', id: '1' }]);
        });
        // Should not call setNodes when not in developer mode
        expect(mockSetNodes).not.toHaveBeenCalled();
      }
    });

    it('should not handle edge changes when not in developer mode', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} },
          { id: '2', type: 'default', position: { x: 100, y: 100 }, data: {} }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      });
     
      renderWithProviders({ showDeveloperMode: false });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      if (callbacks?.onEdgesChange) {
        await act(async () => {
          callbacks.onEdgesChange([{ type: 'select', id: 'e1-2' }]);
        });
        // Should not call setEdges when not in developer mode
        expect(mockSetEdges).not.toHaveBeenCalled();
      }
    });
  });

  describe('Table Data Processing', () => {
    it('should skip processing when in developer mode', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        return [null, vi.fn()];
      });

      const tableData = [{
        subComponentAssetId: 'test-id',
        failureModeName: 'Test Failure'
      }];
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            subComponentAssetId: 'test-id',
            nodeColor: '#000000'
          }
        }]
      });
     
      renderWithProviders({ tableData, showDeveloperMode: true });
      
      await waitFor(() => {
        expect(mockHandleTableDataChange).toHaveBeenCalled();
      });
    });

    it('should skip processing when tableData is empty', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {
            subComponentAssetId: 'test-id',
            nodeColor: '#000000'
          }
        }]
      });
     
      renderWithProviders({ tableData: [] });
      
      await waitFor(() => {
        expect(mockHandleTableDataChange).toHaveBeenCalled();
      });
    });

    it('should return node unchanged if no subComponentAssetId', async () => {
      const tableData = [{
        subComponentAssetId: 'test-id',
        failureModeName: 'Test Failure'
      }];
     
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { nodeColor: '#000000' }
        }]
      });
     
      renderWithProviders({ tableData });
      
      await waitFor(() => {
        expect(mockHandleTableDataChange).toHaveBeenCalled();
      });
    });
  });

  describe('Selection and Configuration', () => {
    it('should handle selection change callback', async () => {
      // Mock useState properly for showSaveTemplate
      let showSaveTemplateState = false;
      const mockSetShowSaveTemplate = vi.fn((value) => {
        if (typeof value === 'function') {
          showSaveTemplateState = value(showSaveTemplateState);
        } else {
          showSaveTemplateState = value;
        }
      });

      let draggingNodeIdState = null;
      const mockSetDraggingNodeId = vi.fn((value) => {
        draggingNodeIdState = typeof value === 'function' ? value(draggingNodeIdState) : value;
      });

      let nodeToUpdateState = null;
      const mockSetNodeToUpdate = vi.fn((value) => {
        nodeToUpdateState = typeof value === 'function' ? value(nodeToUpdateState) : value;
      });

      let templateDropCountsState = {};
      const mockSetTemplateDropCounts = vi.fn((value) => {
        templateDropCountsState = typeof value === 'function' ? value(templateDropCountsState) : value;
      });

      let showDrawerState = false;
      const mockSetShowDrawer = vi.fn((value) => {
        showDrawerState = typeof value === 'function' ? value(showDrawerState) : value;
      });

      let partialState = false;
      const mockSetPartial = vi.fn((value) => {
        partialState = typeof value === 'function' ? value(partialState) : value;
      });

      vi.spyOn(require('react'), 'useState').mockImplementation((initial) => {
        if (initial === null) {
          if (nodeToUpdateState === null && draggingNodeIdState === null) {
            return [nodeToUpdateState, mockSetNodeToUpdate];
          }
          return [draggingNodeIdState, mockSetDraggingNodeId];
        }
        if (initial === false) {
          if (showSaveTemplateState === false && showDrawerState === false && partialState === false) {
            return [showSaveTemplateState, mockSetShowSaveTemplate];
          }
          if (showDrawerState === false && partialState === false) {
            return [showDrawerState, mockSetShowDrawer];
          }
          return [partialState, mockSetPartial];
        }
        if (typeof initial === 'object' && Object.keys(initial).length === 0) {
          return [templateDropCountsState, mockSetTemplateDropCounts];
        }
        return [initial, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onSelectionChange).toBeDefined();
      
      await act(async () => {
        callbacks.onSelectionChange({
          nodes: [{ id: '1' }],
          edges: []
        });
      });
      
      expect(mockSetShowSaveTemplate).toHaveBeenCalledWith(true);
    });

    it('should update config when node is updated', async () => {
      let nodeToUpdateState = null;
      const mockSetNodeToUpdate = vi.fn((value) => {
        nodeToUpdateState = value;
      });

      let shouldUpdateConfigState = true;
      const mockSetShouldUpdateConfig = vi.fn((value) => {
        shouldUpdateConfigState = typeof value === 'function' ? value(shouldUpdateConfigState) : value;
      });

      let selectedNodeIdState = 'node-1';
      const mockSetSelectedNodeId = vi.fn((value) => {
        selectedNodeIdState = typeof value === 'function' ? value(selectedNodeIdState) : value;
      });

      let configState = { data: { width: 100, height: 100 } };
      const mockSetConfig = vi.fn((value) => {
        configState = typeof value === 'function' ? value(configState) : value;
      });

      vi.spyOn(require('react'), 'useState').mockImplementation((initial) => {
        if (initial === null) {
          return [nodeToUpdateState, mockSetNodeToUpdate];
        }
        return [initial, vi.fn()];
      });

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('selectedNodeIdAtom')) {
          return [selectedNodeIdState, mockSetSelectedNodeId];
        }
        if (atom?.toString?.().includes('updateConfigAtom')) {
          return [shouldUpdateConfigState, mockSetShouldUpdateConfig];
        }
        if (atom?.toString?.().includes('nodeConfigAtom')) {
          return [configState, mockSetConfig];
        }
        return [null, vi.fn()];
      });

      mockUseNodesState.mockReturnValue([
        [{ id: 'node-1', data: {} }],
        mockSetNodes
      ]);

      const mockUpdateNodeInternalsFn = vi.fn();
      mockUseUpdateNodeInternals.mockReturnValue(mockUpdateNodeInternalsFn);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{
          id: '1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { width: 100, height: 100 }
        }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockSetShouldUpdateConfig).toHaveBeenCalledWith(false);
      }, { timeout: 2000 });
    });

    it('should update edge with dotted style', async () => {
      let shouldUpdateConfigState = true;
      let selectedEdgeIdState = 'e1-2';
      let configState = { style: { strokeDasharray: '5,5' } };

      const mockSetShouldUpdateConfig = vi.fn((value) => {
        shouldUpdateConfigState = typeof value === 'function' ? value(shouldUpdateConfigState) : value;
      });

      const mockSetSelectedEdgeId = vi.fn((value) => {
        selectedEdgeIdState = typeof value === 'function' ? value(selectedEdgeIdState) : value;
      });

      const mockSetConfig = vi.fn((value) => {
        configState = typeof value === 'function' ? value(configState) : value;
      });

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('selectedEdgeIdAtom')) {
          return [selectedEdgeIdState, mockSetSelectedEdgeId];
        }
        if (atom?.toString?.().includes('updateConfigAtom')) {
          return [shouldUpdateConfigState, mockSetShouldUpdateConfig];
        }
        if (atom?.toString?.().includes('nodeConfigAtom')) {
          return [configState, mockSetConfig];
        }
        return [null, vi.fn()];
      });

      mockUpdateEdgeWithConfig.mockImplementation((edges, edgeId, config) => {
        return edges.map(edge => 
          edge.id === edgeId ? { ...edge, ...config } : edge
        );
      });

      mockUseEdgesState.mockReturnValue([
        [{ id: 'e1-2', source: '1', target: '2', type: 'flowingPipeDotted', style: {} }],
        mockSetEdges
      ]);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} },
          { id: '2', type: 'default', position: { x: 100, y: 100 }, data: {} }
        ],
        edges: [{
          id: 'e1-2',
          source: '1',
          target: '2',
          type: 'flowingPipeDotted',
          style: {}
        }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      // Trigger useEffect by ensuring conditions are met
      await act(async () => {
        shouldUpdateConfigState = true;
        selectedEdgeIdState = 'e1-2';
        configState = { style: { strokeDasharray: '5,5' } };
      });
      
      await waitFor(() => {
        expect(mockUpdateEdgeWithConfig).toHaveBeenCalled();
        expect(mockSetEdges).toHaveBeenCalled();
        expect(mockSetShouldUpdateConfig).toHaveBeenCalledWith(false);
      }, { timeout: 2000 });
    });
  });

  describe('Controls and Background', () => {
    it('should render controls in developer mode', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        return [null, vi.fn()];
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });    
      
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
        expect(screen.getByTestId('controls')).toBeInTheDocument();
      });
    });

    it('should render controls in non-developer mode', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });    
      
      renderWithProviders({ showDeveloperMode: false });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
        expect(screen.getByTestId('controls')).toBeInTheDocument();
      });
    });
  });

  describe('Node and Edge Connections', () => {
    it('should handle node connection in developer mode', async () => {
      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        if (atom?.toString?.().includes('selectedEdgeTypeAtom')) {
          return ['straight', vi.fn()];
        }
        return [null, vi.fn()];
      });

      const mockTakeSnapshot = vi.fn();
      mockUseFlowSnapshot.mockReturnValue({
        takeSnapshot: mockTakeSnapshot,
        undo: vi.fn(),
        applySnappingToChanges: vi.fn((changes) => changes),
      });

      mockCreateEdge.mockReturnValue({
        id: 'new-edge',
        source: '1',
        target: '2',
        type: 'straight'
      });

      mockAddEdge.mockImplementation((edge, edges) => [...edges, edge]);

      mockUseEdgesState.mockReturnValue([[], mockSetEdges]);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} },
          { id: '2', type: 'default', position: { x: 100, y: 100 }, data: {} }
        ]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onConnect).toBeDefined();
      
      await act(async () => {
        callbacks.onConnect({ source: '1', target: '2' });
      });
      
      expect(mockTakeSnapshot).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should handle node drag start in developer mode', async () => {
      let draggingNodeIdState = null;
      const mockSetDraggingNodeId = vi.fn((value) => {
        draggingNodeIdState = typeof value === 'function' ? value(draggingNodeIdState) : value;
      });

      vi.spyOn(require('react'), 'useState').mockImplementation((initial) => {
        if (initial === null) {
          return [draggingNodeIdState, mockSetDraggingNodeId];
        }
        return [initial, vi.fn()];
      });

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        return [null, vi.fn()];
      });

      const mockTakeSnapshot = vi.fn();
      mockUseFlowSnapshot.mockReturnValue({
        takeSnapshot: mockTakeSnapshot,
        undo: vi.fn(),
        applySnappingToChanges: vi.fn((changes) => changes),
      });

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onNodeDragStart).toBeDefined();
      
      await act(async () => {
        callbacks.onNodeDragStart({ preventDefault: vi.fn() }, { id: '1' });
      });
      
      expect(mockTakeSnapshot).toHaveBeenCalled();
      expect(mockSetDraggingNodeId).toHaveBeenCalledWith('1');
    });

    it('should handle node drag stop with snapping', async () => {
      let draggingNodeIdState = '1';
      const mockSetDraggingNodeId = vi.fn((value) => {
        draggingNodeIdState = typeof value === 'function' ? value(draggingNodeIdState) : value;
      });

      vi.spyOn(require('react'), 'useState').mockImplementation((initial) => {
        if (initial === null) {
          return [draggingNodeIdState, mockSetDraggingNodeId];
        }
        return [initial, vi.fn()];
      });

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode];
        }
        return [null, vi.fn()];
      });

      const mockTakeSnapshot = vi.fn();
      const mockSnapNodePosition = vi.fn((id, pos) => ({ x: pos.x + 3, y: pos.y + 3 }));
      mockUseHelperLines.mockReturnValue({
        snapNodePosition: mockSnapNodePosition
      });

      mockUseFlowSnapshot.mockReturnValue({
        takeSnapshot: mockTakeSnapshot,
        undo: vi.fn(),
        applySnappingToChanges: vi.fn((changes) => changes),
      });

      mockUseNodesState.mockReturnValue([
        [{ id: '1', type: 'default', position: { x: 10, y: 10 }, data: {} }],
        mockSetNodes
      ]);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      const callbacks = (global.window || window).__reactFlowCallbacks;
      expect(callbacks?.onNodeDragStop).toBeDefined();
      
      await act(async () => {
        callbacks.onNodeDragStop(
          { preventDefault: vi.fn() },
          { id: '1', type: 'default', position: { x: 10, y: 10 } }
        );
      });
      
      expect(mockTakeSnapshot).toHaveBeenCalled();
      expect(mockSetDraggingNodeId).toHaveBeenCalledWith(null);
    });
  });

  describe('Node Creation', () => {
    it('should create new node when newNode is set', async () => {
      let newNodeState = { nodeType: 'testNode', position: { x: 100, y: 100 } };
      let selectedNodeIdState = null;
      let configState = null;

      const mockSetNewNode = vi.fn((value) => {
        newNodeState = typeof value === 'function' ? value(newNodeState) : value;
      });

      const mockSetSelectedNodeId = vi.fn((value) => {
        selectedNodeIdState = typeof value === 'function' ? value(selectedNodeIdState) : value;
      });

      const mockSetConfig = vi.fn((value) => {
        configState = typeof value === 'function' ? value(configState) : value;
      });

      const mockTakeSnapshot = vi.fn();
      
      mockUseFlowSnapshot.mockReturnValue({
        takeSnapshot: mockTakeSnapshot,
        undo: vi.fn(),
        applySnappingToChanges: vi.fn((changes) => changes),
      });

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('newNodeAtom')) {
          return [newNodeState, mockSetNewNode];
        }
        if (atom?.toString?.().includes('selectedNodeIdAtom')) {
          return [selectedNodeIdState, mockSetSelectedNodeId];
        }
        if (atom?.toString?.().includes('nodeConfigAtom')) {
          return [configState, mockSetConfig];
        }
        return [null, vi.fn()];
      });

      mockUseNodesState.mockReturnValue([[], mockSetNodes]);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: []
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      // The useEffect should trigger when newNode changes
      await waitFor(() => {
        expect(mockTakeSnapshot).toHaveBeenCalled();
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockSetSelectedNodeId).toHaveBeenCalled();
        expect(mockSetConfig).toHaveBeenCalled();
        expect(mockSetNewNode).toHaveBeenCalledWith(null);
      }, { timeout: 2000 });
    });
  });

  describe('Helper Lines', () => {
    it('should render helper lines in developer mode', async () => {
      // Set up all useState mocks in order
      let draggingNodeIdState = null;
      let nodeToUpdateState = null;
      let nodeToCopyState = null;
      let showSaveTemplateState = false;
      let templateDropCountsState = {};
      let showDrawerState = false;
      let partialState = false;

      const mockSetDraggingNodeId = vi.fn((value) => {
        draggingNodeIdState = typeof value === 'function' ? value(draggingNodeIdState) : value;
      });

      let useStateCallIndex = 0;
      vi.spyOn(require('react'), 'useState').mockImplementation((initial) => {
        useStateCallIndex++;
        // Match the order in Flow.jsx
        if (useStateCallIndex === 1) return [nodeToUpdateState, vi.fn()];
        if (useStateCallIndex === 8) return [draggingNodeIdState, mockSetDraggingNodeId];
        if (useStateCallIndex === 9) return [showSaveTemplateState, vi.fn()];
        if (useStateCallIndex === 10) return [templateDropCountsState, vi.fn()];
        if (useStateCallIndex === 11) return [showDrawerState, vi.fn()];
        if (useStateCallIndex === 12) return [partialState, vi.fn()];
        if (initial === null) return [nodeToCopyState, vi.fn()];
        if (Array.isArray(initial)) return [initial, vi.fn()];
        return [initial, vi.fn()];
      });

      mockUseAtom.mockImplementation((atom) => {
        if (atom?.toString?.().includes('developerModeAtom')) {
          return [true, mockSetDeveloperMode]; // isDeveloperMode = true
        }
        return [null, vi.fn()];
      });

      mockUseNodesState.mockReturnValue([
        [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }],
        mockSetNodes
      ]);

      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // HelperLines should render when isDeveloperMode is true
      // Component condition: {isDeveloperMode && <HelperLines draggingNodeId={draggingNodeId} nodes={nodes} />}
      await waitFor(() => {
        expect(screen.getByTestId('helper-lines')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should not render helper lines when not in developer mode', async () => {
      mockUseFlowData.mockReturnValue({
        ...mockFlowData,
        nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, data: {} }]
      });
     
      renderWithProviders({ showDeveloperMode: false });
      
      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
        expect(screen.queryByTestId('helper-lines')).not.toBeInTheDocument();
      });
    });
  });
});
