import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Handles from "./Handles";
import { Position } from "@xyflow/react";
import { useAtomValue } from "jotai";

 vi.mock(import("jotai"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
   useAtomValue: vi.fn(),
  }
})

vi.mock("@xyflow/react", () => {
  return {
    Position: {
      Left: "left",
      Right: "right",
      Top: "top",
      Bottom: "bottom",
    },
    Handle: ({ id, type, position, style, "data-testid": dtid }) => (
<div
        data-testid={dtid || id}
        data-type={type}
        data-position={position}
        style={style}
      />
    ),
  };
});
describe("Handles", () => {
  const mockUseAtomValue = useAtomValue;
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const renderWithShow = (show) => {
    mockUseAtomValue.mockReturnValue(show);
    render(<Handles id="node-1" />);
  };
  it("renders all 8 handles with correct ids, types and positions", () => {
    renderWithShow(true);
    const expected = [
      { id: "node-1-target-left", type: "target", position: Position.Left },
      { id: "node-1-source-left", type: "source", position: Position.Left },
      { id: "node-1-target-right", type: "target", position: Position.Right },
      { id: "node-1-source-right", type: "source", position: Position.Right },
      { id: "node-1-target-top", type: "target", position: Position.Top },
      { id: "node-1-source-top", type: "source", position: Position.Top },
      { id: "node-1-target-bottom", type: "target", position: Position.Bottom },
      { id: "node-1-source-bottom", type: "source", position: Position.Bottom },
    ];
    for (const h of expected) {
      const el = screen.getByTestId(h.id);
      expect(el).toBeInTheDocument();
      expect(el.getAttribute("data-type")).toBe(h.type);
      expect(el.getAttribute("data-position")).toBe(h.position);
    }
  });
  it("applies base handle style and per-side overrides when visible", () => {
    renderWithShow(true);
    const leftTarget = screen.getByTestId("node-1-target-left");
    expect(leftTarget.style.top).toBe("50%");
    expect(leftTarget.style.transform).toBe("translateY(-50%)");
    expect(leftTarget.style.opacity).toBe("1");
    expect(leftTarget.style.left).toBe("-4px");
    const rightSource = screen.getByTestId("node-1-source-right");
    expect(rightSource.style.right).toBe("-4px");
    const topTarget = screen.getByTestId("node-1-target-top");
    expect(topTarget.style.left).toBe("50%");
    expect(topTarget.style.transform).toBe("translateX(-50%)");
    expect(topTarget.style.top).toBe("-4px");
    const bottomSource = screen.getByTestId("node-1-source-bottom");
    expect(bottomSource.style.bottom).toBe("-4px");
    expect(bottomSource.style.top).toBe("auto");
  });
  it("sets opacity to 0 when showHandlesAtom is false", () => {
    renderWithShow(false);
    const anyHandle = screen.getByTestId("node-1-target-left");
    expect(anyHandle.style.opacity).toBe("0");
  });
});