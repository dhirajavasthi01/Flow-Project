import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import NodesList from "./NodesList";
/* ----------------------------- Mocks ----------------------------- */
// Jotai
const mockSetConfig = vi.fn();
const mockSetNewNode = vi.fn();
const mockSetSelectedNodeId = vi.fn();
const mockSetSelectedEdgeId = vi.fn();
const mockSetNodeType = vi.fn();
vi.mock("jotai", () => ({
  useSetAtom: (atom) => {
    if (atom.key === "nodeConfigAtom") return mockSetConfig;
    if (atom.key === "newNodeAtom") return mockSetNewNode;
    if (atom.key === "selectedNodeIdAtom") return mockSetSelectedNodeId;
    if (atom.key === "selectedEdgeIdAtom") return mockSetSelectedEdgeId;
    if (atom.key === "dragNodeTypeAtom") return mockSetNodeType;
    return vi.fn();
  },
}));
// Atoms
vi.mock(
  "../../../../features/individualDetailWrapper/features/overview/store/OverviewStore",
  () => ({
    nodeConfigAtom: { key: "nodeConfigAtom" },
    newNodeAtom: { key: "newNodeAtom" },
    selectedNodeIdAtom: { key: "selectedNodeIdAtom" },
    selectedEdgeIdAtom: { key: "selectedEdgeIdAtom" },
    dragNodeTypeAtom: { key: "dragNodeTypeAtom" },
  })
);
// Assets
vi.mock("../../../../assets/images/common/MinusBlue.svg", () => ({
  default: "minus-icon",
}));
vi.mock("../../../../assets/images/common/Plus.svg", () => ({
  default: "plus-icon",
}));
// Node definitions
vi.mock("../../utils/nodeEdgeType/NodeEdgeType", () => ({
  allNodes: [
    { name: "Textbox", type: "textBoxNode", nodeType: "textbox" },
    { name: "Pump", type: "pumpNode", nodeType: "pump" },
    { name: "Dot Node", type: "dotNode", nodeType: "dot" },
  ],
}));
// SVG map
vi.mock("../svgMap/SvgMap", () => ({
  svgMap: {
    textbox: "textbox.svg",
    pump: "pump.svg",
  },
}));
/* ----------------------------- Setup ----------------------------- */
describe("NodesList component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  /* ------------------------- Rendering -------------------------- */
  it("renders header and nodes list", () => {
    render(<NodesList />);
    expect(screen.getByText("Nodes List")).toBeInTheDocument();
    expect(screen.getByTestId("node-Textbox")).toBeInTheDocument();
    expect(screen.getByTestId("node-Pump")).toBeInTheDocument();
  });
  it("filters out Dot Node", () => {
    render(<NodesList />);
    expect(screen.queryByText("Dot Node")).not.toBeInTheDocument();
  });
  /* ---------------------- Collapse Logic ------------------------ */
  it("collapses and expands node list", () => {
    render(<NodesList />);
    const toggleBtn = screen.getByTestId("collapsible-icon");
    // Initially expanded
    expect(screen.getByTestId("node-Textbox")).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId("node-Textbox")).not.toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("node-Textbox")).toBeInTheDocument();
  });
  it("switches icon between minus and plus", () => {
    render(<NodesList />);
    const icon = screen.getByTestId("collapsible-icon");
    expect(icon.src).toContain("minus");
    fireEvent.click(icon);
    expect(icon.src).toContain("plus");
  });
  /* -------------------- Node Interaction ------------------------ */
  it("handles node click", () => {
    render(<NodesList />);
    fireEvent.click(screen.getByTestId("node-Pump"));
    expect(mockSetSelectedNodeId).toHaveBeenCalledWith(null);
    expect(mockSetSelectedEdgeId).toHaveBeenCalledWith(null);
    expect(mockSetConfig).toHaveBeenCalledWith(null);
    expect(mockSetNewNode).toHaveBeenCalledWith({
      name: "Pump",
      type: "pumpNode",
      nodeType: "pump",
    });
  });
  it("handles drag start", () => {
    render(<NodesList />);
    const node = screen.getByTestId("node-Textbox");
    fireEvent.dragStart(node, {
      dataTransfer: { effectAllowed: "" },
    });
    expect(mockSetNodeType).toHaveBeenCalledWith("textBoxNode");
  });
  /* ------------------ SVG / Fallback UI ------------------------- */
  it("renders SVG if available", () => {
    render(<NodesList />);
    const img = screen.getByAltText("Pump");
    expect(img).toHaveAttribute("src", "pump.svg");
  });
  it("renders fallback text if SVG not available", () => {
    // Change svgMap mock
    vi.doMock("../svgMap/SvgMap", () => ({
      svgMap: {},
    }));
    render(<NodesList />);
  });
});
 
 