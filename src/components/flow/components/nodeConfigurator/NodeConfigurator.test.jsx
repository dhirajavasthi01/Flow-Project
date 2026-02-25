import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import NodeConfigurator from "./NodeConfigurator";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  extractColorsFromSvg,
  normalizeSubComponentAssetIds,
} from "../../../../utills/flowUtills/FlowUtills";
// ---- base mocks ----
vi.mock("jotai", () => ({
  useAtom: vi.fn(),
  useAtomValue: vi.fn(),
  useSetAtom: vi.fn(),
}));
vi.mock(
  "../../../../features/individualDetailWrapper/features/overview/store/OverviewStore",
  () => ({
    nodeConfigAtom: "nodeConfigAtom",
    updateConfigAtom: "updateConfigAtom",
    selectedNodeIdAtom: "selectedNodeIdAtom",
    selectedEdgeIdAtom: "selectedEdgeIdAtom",
    deleteAtom: "deleteAtom",
    selectedPageAtom: "selectedPageAtom",
    subComponentListAtom: "subComponentListAtom",
  }),
);
vi.mock("../../utils/nodeEdgeType/NodeEdgeType", () => ({
  nodeTypesConfig: {
    boxNode: {
      fields: [
        { name: "title", label: "Title", type: "text" },
        { name: "count", label: "Count", type: "number", min: 0 },
        { name: "color", label: "Color", type: "color" },
        { name: "gradient", label: "Gradient", type: "gradientColor" },
        { name: "enabled", label: "Enabled", type: "switch" },
        { name: "template", label: "Template", type: "select" },
        { name: "strokeColor", label: "Stroke Color", type: "color" },
      ],
    },
  },
}));
vi.mock("../../../../utills/flowUtills/FlowUtills", () => ({
  edgeOptions: [
    { id: "straight", name: "Straight" },
    { id: "flowingPipeStraightArrow", name: "Arrow" },
  ],
  extractColorsFromSvg: vi.fn(),
  normalizeSubComponentAssetIds: vi.fn(),
  text_box_resources: [
    { id: "tpl1", bgColor: "#111111", borderColor: "#222222" },
  ],
}));
vi.mock("../svgMap/SvgMap", () => ({
  svgMap: {
    boxNode: "/fake/path.svg",
  },
}));
vi.mock("ADFPUIVisuals/MultiSelect", () => ({
  __esModule: true,
  default: ({ data, onChange, initialValues }) => (
    <div
      data-testid="multiselect"
      data-options={JSON.stringify(data)}
      data-initial={JSON.stringify(initialValues)}
      onClick={() => onChange([{ tag_name: "10", display_name: "SC 10" }])}
    >
      MULTISELECT
    </div>
  ),
}));
const mockUseAtom = useAtom;
const mockUseAtomValue = useAtomValue;
const mockUseSetAtom = useSetAtom;
const mockExtractColorsFromSvg = extractColorsFromSvg;
const mockNormalizeSubComponentAssetIds = normalizeSubComponentAssetIds;
describe("NodeConfigurator", () => {
  let setConfig;
  let setSelectedNodeId;
  let setSelectedEdgeId;
  let setShouldUpdateConfig;
  let setDelete;
  const renderComponent = () => render(<NodeConfigurator />);
  beforeEach(() => {
    vi.clearAllMocks();
    setConfig = vi.fn();
    setSelectedNodeId = vi.fn();
    setSelectedEdgeId = vi.fn();
    setShouldUpdateConfig = vi.fn();
    setDelete = vi.fn();
    // default useAtom behavior for all tests
    mockUseAtom.mockImplementation((atom) => {
      if (atom === "nodeConfigAtom") {
        return [
          {
            id: "node-1",
            name: "Box 1",
            nodeType: "boxNode",
            data: {
              title: "Initial",
              count: 1,
              color: "#ff0000",
              gradientStart: "",
              gradientEnd: "",
              strokeColor: "#000000",
              subComponentAssetId: ["10"],
            },
          },
          setConfig,
        ];
      }
      if (atom === "selectedNodeIdAtom") {
        return ["node-1", setSelectedNodeId];
      }
      if (atom === "selectedEdgeIdAtom") {
        return [null, setSelectedEdgeId];
      }
      return [null, vi.fn()];
    });
    mockUseSetAtom.mockImplementation((atom) => {
      if (atom === "updateConfigAtom") return setShouldUpdateConfig;
      if (atom === "deleteAtom") return setDelete;
      return vi.fn();
    });
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === "selectedPageAtom") return "overview";
      if (atom === "subComponentListAtom") {
        return [
          { entityID: 10, entityName: "SC 10" },
          { entityID: 20, entityName: "SC 20" },
        ];
      }
      return null;
    });
    mockExtractColorsFromSvg.mockResolvedValue({
      gradientStart: "#123456",
      gradientEnd: "#654321",
    });
    mockNormalizeSubComponentAssetIds.mockReturnValue(["10"]);
  });
  it("renders empty state when no node/edge is selected", () => {
    mockUseAtom.mockImplementation((atom) => {
      if (atom === "nodeConfigAtom") return [null, setConfig];
      if (atom === "selectedNodeIdAtom") return [null, setSelectedNodeId];
      if (atom === "selectedEdgeIdAtom") return [null, setSelectedEdgeId];
      return [null, vi.fn()];
    });
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === "selectedPageAtom") return "overview";
      if (atom === "subComponentListAtom") return [];
      return null;
    });
    const { getByText } = renderComponent();
    expect(getByText(/Configure Node/i)).toBeInTheDocument();
    expect(
      getByText(/Please select a node\/edge to configure/i),
    ).toBeInTheDocument();
  });

  it("extracts colors from svg and updates gradient if missing, then triggers updateConfig", async () => {
    renderComponent();
    await act(async () => {});
    expect(mockExtractColorsFromSvg).toHaveBeenCalledWith("/fake/path.svg");
    expect(setConfig).toHaveBeenCalled();
  });

  it("handleColorChange updates both gradientStart and gradientEnd", () => {
    renderComponent();

    // get all color inputs by tagName and type
    const colorInputs = Array.from(
      document.querySelectorAll('input[type="color"]'),
    );
    const gradientStartInput = colorInputs.find(
      (el) => el.name === "gradientStart",
    );

    // ensure we actually found it
    expect(gradientStartInput).toBeDefined();

    fireEvent.change(gradientStartInput, {
      target: {
        name: "gradientStart",
        value: "#111111",
        type: "color",
        checked: false,
      },
    });

    expect(setConfig).toHaveBeenCalled();
  });
  it("renders edge configuration when only selectedEdgeId is set", () => {
    mockUseAtom.mockImplementation((atom) => {
      if (atom === "nodeConfigAtom") {
        return [
          {
            id: "edge-1",
            type: "straight",
            style: { stroke: "#123123", strokeWidth: 3 },
            markerEnd: { width: 10, height: 10, color: "#123123" },
          },
          setConfig,
        ];
      }
      if (atom === "selectedNodeIdAtom") return [null, setSelectedNodeId];
      if (atom === "selectedEdgeIdAtom") return ["edge-1", setSelectedEdgeId];
      return [null, vi.fn()];
    });
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === "selectedPageAtom") return "overview";
      if (atom === "subComponentListAtom") return [];
      return null;
    });

    const { getByText, getByDisplayValue, container } = renderComponent();

    expect(getByText(/Edge id/i)).toBeInTheDocument();
    expect(getByText("edge-1")).toBeInTheDocument();

    const typeSelect = container.querySelector('select[name="type"]');
    fireEvent.change(typeSelect, {
      target: { name: "type", value: "flowingPipeStraightArrow" },
    });
    expect(setConfig).toHaveBeenCalled();

    const colorInput = getByDisplayValue("#123123");
    fireEvent.change(colorInput, {
      target: { value: "#999999" },
    });
    expect(setConfig).toHaveBeenCalled();

    const widthInput = getByDisplayValue("3");
    fireEvent.change(widthInput, {
      target: { value: "6" },
    });
    expect(setConfig).toHaveBeenCalled();

    const sizeInput = getByDisplayValue("10");
    fireEvent.change(sizeInput, {
      target: { value: "20" },
    });
    expect(setConfig).toHaveBeenCalled();

    fireEvent.click(getByText(/Apply/i));
    expect(setShouldUpdateConfig).toHaveBeenCalledWith(true);

    fireEvent.click(getByText(/^Close$/i));
    expect(setSelectedEdgeId).toHaveBeenCalledWith(null);

    fireEvent.click(getByText(/Delete/i));
    expect(setDelete).toHaveBeenCalledWith(true);
  });
});
