import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HandleNodeList from "./HandleNodeList";
import { useAtomValue, useSetAtom } from "jotai";

vi.mock("jotai", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAtomValue: vi.fn(),
    useSetAtom: vi.fn(),
  };
});

vi.mock("../../utils/nodeEdgeType/NodeEdgeType", () => ({
  allNodes: [
    {
      name: "Dot Node",
      nodeType: "valid-handle",
      type: "dot-type",
      data: { dotPosition: "bottom" },
    },
    {
      name: "Dot Node",
      nodeType: "dot-node",
      type: "ignored",
      data: { dotPosition: "top" },
    },
    {
      name: "Other Node",
      nodeType: "other",
      type: "other",
      data: { dotPosition: "left" },
    },
  ],
}));

vi.mock("../../../../assets/images/flowIcons/Dot.svg", () => ({
  default: "dot-icon.svg",
}));
describe("HandleNodeList", () => {
  const mockUseAtomValue = useAtomValue;
  const mockUseSetAtom = useSetAtom;
  const setConfig = vi.fn();
  const setNewNode = vi.fn();
  const setSelectedNodeId = vi.fn();
  const setSelectedEdgeId = vi.fn();
  const setNodeType = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSetAtom
      .mockReturnValueOnce(setConfig)
      .mockReturnValueOnce(setNewNode)
      .mockReturnValueOnce(setSelectedNodeId)
      .mockReturnValueOnce(setSelectedEdgeId)
      .mockReturnValueOnce(setNodeType);
  });
  it("applies correct img style based on dotPosition and name", () => {
    mockUseAtomValue.mockReturnValue(true);
    render(<HandleNodeList />);

    const img = screen.getByAltText("Dot Node");
    expect(img).toBeInTheDocument();
    expect(img.style.width).toBe("1vmin");
    expect(img.style.height).toBe("1vmin");

    expect(img.style.marginLeft).toBe("5px");
  });
  it("sets drag node type on dragStart", () => {
    mockUseAtomValue.mockReturnValue(true);
    render(<HandleNodeList />);
    const dotNodeDiv = screen.getByTestId("node-Dot Node");
    const dataTransfer = { effectAllowed: "" };
    fireEvent.dragStart(dotNodeDiv, { dataTransfer });
    expect(setNodeType).toHaveBeenCalledWith("dot-type");
    expect(dataTransfer.effectAllowed).toBe("move");
  });
  it("calls handleNodeClick sequence on click", () => {
    mockUseAtomValue.mockReturnValue(true);
    render(<HandleNodeList />);
    const dotNodeDiv = screen.getByTestId("node-Dot Node");
    fireEvent.click(dotNodeDiv);
    expect(setSelectedNodeId).toHaveBeenCalledWith(null);

    expect(setNewNode).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Dot Node" }),
    );
  });
});
