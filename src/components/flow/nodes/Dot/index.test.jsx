import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock(import("jotai"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAtomValue: vi.fn(),
  };
});
import { useAtomValue } from "jotai";

vi.mock("@xyflow/react", () => ({
  Handle: ({ id, type, position, style }) => (
    <div
      data-testid={`handle-${id}`}
      data-type={type}
      data-position={position}
      style={style}
    />
  ),
}));
import Dot from "./index";
describe("Dot Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const defaultProps = {
    id: "node-1",
    data: {
      nodeColor: "#123456",
      dotPosition: "top",
    },
  };
  function mockShowHandles(value) {
    useAtomValue.mockReturnValue(value);
  }
  it("renders dot and both handles", () => {
    mockShowHandles(true);
    render(<Dot {...defaultProps} />);

    const dot = screen.getByTestId("handle-node-1-target-center").parentElement;
    expect(dot).toBeInTheDocument();

    expect(
      screen.getByTestId("handle-node-1-target-center"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("handle-node-1-source-center"),
    ).toBeInTheDocument();
  });
  it("applies opacity:1 when showHandles is true", () => {
    mockShowHandles(true);
    const { container } = render(<Dot {...defaultProps} />);
    const dotDiv = container.querySelector("div");
    expect(dotDiv).toHaveStyle({
      opacity: "1",
    });
  });
  it("applies opacity:0 when showHandles is false", () => {
    mockShowHandles(false);
    const { container } = render(<Dot {...defaultProps} />);
    const dotDiv = container.querySelector("div");
    expect(dotDiv).toHaveStyle({
      opacity: "0",
    });
  });
  it("sets background color to nodeColor", () => {
    mockShowHandles(true);
    const { container } = render(<Dot {...defaultProps} />);
    const dotDiv = container.querySelector("div");
    expect(dotDiv).toHaveStyle({
      backgroundColor: "#123456",
    });
  });
  it("renders handles with correct types, ids, and position", () => {
    mockShowHandles(true);
    render(<Dot {...defaultProps} />);
    const targetHandle = screen.getByTestId("handle-node-1-target-center");
    const sourceHandle = screen.getByTestId("handle-node-1-source-center");

    expect(targetHandle.dataset.type).toBe("target");
    expect(sourceHandle.dataset.type).toBe("source");

    expect(targetHandle.dataset.position).toBe("top");
    expect(sourceHandle.dataset.position).toBe("top");

    expect(targetHandle).toHaveAttribute(
      "data-testid",
      "handle-node-1-target-center",
    );
    expect(sourceHandle).toHaveAttribute(
      "data-testid",
      "handle-node-1-source-center",
    );
  });
  it("applies correct handle styles", () => {
    mockShowHandles(true);
    render(<Dot {...defaultProps} />);
    const targetHandle = screen.getByTestId("handle-node-1-target-center");
    const sourceHandle = screen.getByTestId("handle-node-1-source-center");

    const expectedBaseStyle = {
      width: "6px",
      height: "6px",
      left: "50%",
      position: "relative",
      transform: "translate(-50%, -50%)",
    };
    Object.entries(expectedBaseStyle).forEach(([key, val]) => {
      expect(targetHandle.style[key]).toBe(val);
      expect(sourceHandle.style[key]).toBe(val);
    });

    expect(targetHandle.style.top).toBe("50%");
    expect(sourceHandle.style.top).toBe("0%");
  });
});
