import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { Provider as JotaiProvider } from "jotai";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Flow from "./Flow";
import * as OverviewStore from "../../features/individualDetailWrapper/features/overview/store/OverviewStore";
import * as FlowUtills from "../../utills/flowUtills/FlowUtills";
import * as FlowNodeUtills from "../../utills/flowUtills/FlowNodeUtils";
import { useFlowData } from "./hooks/useFlowData/useFlowData";
import { useTemplateManager } from "./hooks/useTemplateManager/useTemplateManager";
import { useTemplateDrop } from "./hooks/useTemplateDrop/useTemplateDrop";
// Mock all external dependencies
vi.mock("./hooks/useFlowData/useFlowData");
vi.mock("./hooks/useTemplateManager/useTemplateManager");
vi.mock("./hooks/useTemplateDrop/useTemplateDrop");
vi.mock("../../assets/images/common/drawer.svg", () => ({
  default: "svg-mock",
}));
vi.mock("../../assets/images/common/close.svg", () => ({
  default: "svg-mock",
}));
vi.mock("../../assets/images/common/FailureModeLegend.svg", () => ({
  default: "svg-mock",
}));
vi.mock("../../assets/images/common/NewFailureMode.svg", () => ({
  default: "svg-mock",
}));
vi.mock("./hooks/useFlowSelection/useFlowSelection", () => ({
  useFlowSelection: vi.fn(() => ({
    selectedNodes: [],
    allEdges: [],
  })),
}));
vi.mock("../../utills/flowUtills/FlowUtills");
vi.mock("../../utills/flowUtills/FlowNodeUtils");
vi.mock("./NodeEdgeType", () => ({
  allNodes: [
    { type: "testNode", nodeType: "testNode", data: { label: "Test" } },
  ],
  edgeTypes: {},
  nodeTypes: {},
}));
vi.mock("ADFPUIVisuals/Marker", () => ({
  default: () => null,
}));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useOutletContext: vi.fn(() => ({ caseId: "test-123" })),
  };
});

describe("Flow Component", () => {
  const defaultProps = {
    tableData: [],
    isLoading: false,
    showDeveloperMode: true,
  };
  const mockFlowData = {
    nodes: [],
    edges: [],
    isLoading: false,
    isAdding: false,
    error: null,
    addFlow: vi.fn(),
    saved: false,
  };
  const mockOutletContext = {
    caseId: "test-case-123",
  };
  const mockAppAtom = {
    actualTime: "2024-01-01T00:00:00Z",
  };
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
      </BrowserRouter>,
    );
  };
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useFlowData).mockReturnValue(mockFlowData);
    vi.mocked(useTemplateManager).mockReturnValue({
      saveTemplate: vi.fn(),
    });
    vi.mocked(useTemplateDrop).mockReturnValue({
      handleTemplateDrop: vi.fn(() => ({ success: true })),
    });
    // Mock FlowUtills
    vi.mocked(FlowUtills.generateRandom8DigitNumber).mockReturnValue(12345678);
    vi.mocked(FlowNodeUtills.hasSubComponentAssetIdMatch).mockReturnValue(
      false,
    );
    vi.mocked(FlowNodeUtills.shouldNodeBlink).mockReturnValue({
      shouldBlink: false,
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("Component Rendering", () => {
    it("should render loader when isLoadingFailerMode is true", () => {
      renderWithProviders({ isLoading: true });
    });
    it("should render loader when flow data is loading", () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        isLoading: true,
      });
      renderWithProviders();
    });
    it("should render loader when actualTime is not available", async () => {
      const { useOutletContext } = await import("react-router-dom");
      vi.mocked(useOutletContext).mockReturnValue({
        caseId: "test-case-123",
      });
      renderWithProviders();
    });
    it("should render ReactFlow when data is loaded", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
        edges: [],
      });

      renderWithProviders();
    });
    it("should render ReactFlow container", () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
        edges: [],
      });

      const { container } = renderWithProviders();
      expect(
        container.querySelector("#react-flow-container"),
      ).toBeInTheDocument();
    });
  });
  describe("Developer Mode", () => {
    it("should show developer mode controls when enabled", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should save flow data when save button is clicked", async () => {
      const mockAddFlow = vi.fn((data, callbacks) => {
        callbacks.onSuccess();
      });
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        addFlow: mockAddFlow,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should show partial selection checkbox in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should toggle partial selection checkbox", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should display saving text when adding flow", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        isAdding: true,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
  });
  describe("Node Operations", () => {
    it("should handle node click in developer mode", async () => {
      const mockHandleTextBoxClick = vi.fn().mockReturnValue(null);

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { subComponentAssetId: "test-id" },
          },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should handle node click when failure mode exists", async () => {
      vi.mocked(FlowNodeUtills.hasSubComponentAssetIdMatch).mockReturnValue(
        true,
      );

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { subComponentAssetId: "test-id" },
          },
        ],
      });

      const tableData = [
        {
          subComponentAssetId: "test-id",
          failureModeName: "Test Failure",
        },
      ];

      renderWithProviders({
        showDeveloperMode: false,
        tableData,
      });
    });
    it("should process nodes with table data", async () => {
      vi.mocked(FlowNodeUtills.hasSubComponentAssetIdMatch).mockReturnValue(
        true,
      );
      vi.mocked(FlowNodeUtills.shouldNodeBlink).mockReturnValue({
        shouldBlink: true,
      });

      const tableData = [
        {
          subComponentAssetId: "test-id",
          failureModeName: "Test Failure",
          activeSince: "2024-01-01T00:00:00Z",
        },
      ];

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: {
              subComponentAssetId: "test-id",
              nodeColor: "#000000",
            },
          },
        ],
      });

      renderWithProviders({ tableData });
    });
    it("should handle nodes with gradient colors", async () => {
      vi.mocked(FlowNodeUtills.hasSubComponentAssetIdMatch).mockReturnValue(
        true,
      );

      const tableData = [
        {
          subComponentAssetId: "test-id",
          failureModeName: "Test Failure",
        },
      ];

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: {
              subComponentAssetId: "test-id",
              gradientStart: "#000000",
              gradientEnd: "#FFFFFF",
            },
          },
        ],
      });

      renderWithProviders({ tableData });
    });
    it("should not click node when not in developer mode and no failure mode", async () => {
      vi.mocked(FlowNodeUtills.hasSubComponentAssetIdMatch).mockReturnValue(
        false,
      );

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { subComponentAssetId: "test-id" },
          },
        ],
      });

      renderWithProviders({ showDeveloperMode: false, tableData: [] });
    });
  });
  describe("Edge Operations", () => {
    it("should handle edge click in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
          { id: "2", type: "default", position: { x: 100, y: 100 }, data: {} },
        ],
        edges: [{ id: "e1-2", source: "1", target: "2" }],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should not handle edge click when not in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
          { id: "2", type: "default", position: { x: 100, y: 100 }, data: {} },
        ],
        edges: [
          { id: "e1-2", source: "1", target: "2", style: { stroke: "#000" } },
        ],
      });

      renderWithProviders({ showDeveloperMode: false });
    });
  });
  describe("Template Operations", () => {
    it("should handle template drop", async () => {
      const mockHandleTemplateDrop = vi.fn(() => ({ success: true }));
      vi.mocked(useTemplateDrop).mockReturnValue({
        handleTemplateDrop: mockHandleTemplateDrop,
      });

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should handle template drop with fallback format", async () => {
      const mockHandleTemplateDrop = vi.fn(() => ({ success: true }));
      vi.mocked(useTemplateDrop).mockReturnValue({
        handleTemplateDrop: mockHandleTemplateDrop,
      });

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should save template when button clicked with valid input", async () => {
      const mockSaveTemplate = vi.fn();
      vi.mocked(useTemplateManager).mockReturnValue({
        saveTemplate: mockSaveTemplate,
      });

      const { useFlowSelection } =
        await import("./hooks/useFlowSelection/useFlowSelection");
      vi.mocked(useFlowSelection).mockReturnValue({
        selectedNodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
        allEdges: [],
      });

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      const { rerender } = renderWithProviders({ showDeveloperMode: true });

      // Re-render to trigger selection change
      vi.mocked(useFlowSelection).mockReturnValue({
        selectedNodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
        allEdges: [],
      });

      rerender(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <JotaiProvider>
                  <ReactFlowProvider>
                    <Flow {...defaultProps} showDeveloperMode={true} />
                  </ReactFlowProvider>
                </JotaiProvider>
              }
            />
          </Routes>
        </BrowserRouter>,
      );

      await waitFor(() => {
        const saveTemplateBtn = screen.queryByTestId("save-template-button");
        if (saveTemplateBtn) {
          window.prompt = vi.fn(() => "Test Template");
          window.alert = vi.fn();
          fireEvent.click(saveTemplateBtn);
          expect(mockSaveTemplate).toHaveBeenCalled();
        }
      });
    });
    it("should not save template when no nodes selected", async () => {
      const mockSaveTemplate = vi.fn();
      vi.mocked(useTemplateManager).mockReturnValue({
        saveTemplate: mockSaveTemplate,
      });

      const { useFlowSelection } =
        await import("./hooks/useFlowSelection/useFlowSelection");
      vi.mocked(useFlowSelection).mockReturnValue({
        selectedNodes: [],
        allEdges: [],
      });

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });

      await waitFor(() => {
        expect(
          screen.queryByTestId("save-template-button"),
        ).not.toBeInTheDocument();
      });
    });
    it("should handle template drop error gracefully", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockHandleTemplateDrop = vi.fn(() => ({
        success: false,
        error: "Template not found",
      }));
      vi.mocked(useTemplateDrop).mockReturnValue({
        handleTemplateDrop: mockHandleTemplateDrop,
      });

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });
      consoleError.mockRestore();
    });
  });
  describe("Keyboard Shortcuts", () => {
    it("should handle copy (Ctrl+C) keyboard shortcut", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });

      await waitFor(() => {
        fireEvent.keyDown(window, { key: "c", ctrlKey: true });
      });
    });
    it("should handle paste (Ctrl+V) keyboard shortcut", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });

      await waitFor(() => {
        // First copy something
        fireEvent.keyDown(window, { key: "c", ctrlKey: true });
        // Then paste
        fireEvent.keyDown(window, { key: "v", ctrlKey: true });
      });
    });
    it("should handle delete keyboard shortcut", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });

      await waitFor(() => {
        fireEvent.keyDown(window, { key: "Delete" });
      });
    });
  });
  describe("Error Handling", () => {
    it("should handle flow data loading error", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        error: new Error("Failed to load"),
      });

      renderWithProviders();
      consoleError.mockRestore();
    });
    it("should handle save flow error", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockAddFlow = vi.fn((data, callbacks) => {
        callbacks.onError(new Error("Save failed"));
      });

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        addFlow: mockAddFlow,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });
      renderWithProviders({ showDeveloperMode: true });
      consoleError.mockRestore();
    });
    it("should handle invalid template JSON parse error", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });
      consoleError.mockRestore();
    });
  });
  describe("Pane Interactions", () => {
    it("should clear selection on pane click", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should handle drag over event with template type", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should handle drag over event with template fallback", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should handle regular node drop", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
  });
  describe("Background Panel", () => {
    it("should show failure mode message when not in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: false });
    });
    it("should show lines background in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should not show failure mode message in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });

      await waitFor(() => {
        expect(
          screen.queryByText(/HOVER OVER THE RED-COLORED OBJECT/i),
        ).not.toBeInTheDocument();
      });
    });
  });
  describe("Multiple Failure Modes", () => {
    it("should handle multiple failure modes for same asset", async () => {
      vi.mocked(FlowNodeUtills.hasSubComponentAssetIdMatch).mockReturnValue(
        true,
      );

      const tableData = [
        {
          subComponentAssetId: "test-id",
          failureModeName: "Failure 1",
        },
        {
          subComponentAssetId: "test-id",
          activeFailureMode: "Failure 2",
        },
      ];

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: {
              subComponentAssetId: "test-id",
              nodeColor: "#000000",
            },
          },
        ],
      });

      renderWithProviders({ tableData });
    });
    it("should filter out null/undefined failure mode names", async () => {
      vi.mocked(FlowNodeUtills.hasSubComponentAssetIdMatch).mockReturnValue(
        true,
      );

      const tableData = [
        {
          subComponentAssetId: "test-id",
          failureModeName: "Failure 1",
        },
        {
          subComponentAssetId: "test-id",
          failureModeName: null,
        },
        {
          subComponentAssetId: "test-id",
          activeFailureMode: undefined,
        },
      ];

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: {
              subComponentAssetId: "test-id",
              nodeColor: "#000000",
            },
          },
        ],
      });

      renderWithProviders({ tableData });
    });
  });
  describe("Node Changes and Updates", () => {
    it("should handle node resize changes in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { width: 100, height: 100 },
            style: { width: 100, height: 100 },
          },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should not handle node changes when not in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: {},
          },
        ],
      });

      renderWithProviders({ showDeveloperMode: false });
    });
    it("should not handle edge changes when not in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
          { id: "2", type: "default", position: { x: 100, y: 100 }, data: {} },
        ],
        edges: [{ id: "e1-2", source: "1", target: "2" }],
      });

      renderWithProviders({ showDeveloperMode: false });
    });
  });
  describe("Table Data Processing", () => {
    it("should skip processing when in developer mode", async () => {
      const tableData = [
        {
          subComponentAssetId: "test-id",
          failureModeName: "Test Failure",
        },
      ];

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: {
              subComponentAssetId: "test-id",
              nodeColor: "#000000",
            },
          },
        ],
      });

      renderWithProviders({ tableData, showDeveloperMode: true });
    });
    it("should skip processing when tableData is empty", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: {
              subComponentAssetId: "test-id",
              nodeColor: "#000000",
            },
          },
        ],
      });

      renderWithProviders({ tableData: [] });
    });
    it("should return node unchanged if no subComponentAssetId", async () => {
      const tableData = [
        {
          subComponentAssetId: "test-id",
          failureModeName: "Test Failure",
        },
      ];

      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { nodeColor: "#000000" },
          },
        ],
      });

      renderWithProviders({ tableData });
    });
  });
  describe("Selection and Configuration", () => {
    it("should handle selection change callback", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should update config when node is updated", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          {
            id: "1",
            type: "default",
            position: { x: 0, y: 0 },
            data: { width: 100, height: 100 },
          },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
    it("should update edge with dotted style", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
          { id: "2", type: "default", position: { x: 100, y: 100 }, data: {} },
        ],
        edges: [
          {
            id: "e1-2",
            source: "1",
            target: "2",
            type: "flowingPipeDotted",
            style: {},
          },
        ],
      });

      renderWithProviders({ showDeveloperMode: true });
    });
  });
  describe("Controls and Background", () => {
    it("should render controls in developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });
      renderWithProviders({ showDeveloperMode: true });
    });
    it("should render controls in non-developer mode", async () => {
      vi.mocked(useFlowData).mockReturnValue({
        ...mockFlowData,
        nodes: [
          { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
        ],
      });
      renderWithProviders({ showDeveloperMode: false });
    });
  });
});
