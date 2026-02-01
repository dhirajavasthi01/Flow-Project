import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useNodeResize } from "./useNodeResize";
/* ------------------ Mock React Flow ------------------ */
const setNodesMock = vi.fn();
vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({
    setNodes: setNodesMock,
  }),
}));
/* ------------------ Test Suite ------------------ */
describe("useNodeResize hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("updates width and height of the matching node", () => {
    const nodes = [
      { id: "1", style: { width: 50, height: 50 } },
      { id: "2", style: { width: 100, height: 100 } },
    ];
    setNodesMock.mockImplementation((updater) => updater(nodes));
    const { result } = renderHook(() => useNodeResize("1"));
    act(() => {
      result.current(null, { width: 200, height: 300 });
    });
    expect(setNodesMock).toHaveBeenCalledTimes(1);
    const updatedNodes = setNodesMock.mock.calls[0][0](nodes);
    expect(updatedNodes).toEqual([
      { id: "1", style: { width: 200, height: 300 } },
      { id: "2", style: { width: 100, height: 100 } },
    ]);
  });
  it("keeps nodes unchanged when id does not match", () => {
    const nodes = [
      { id: "1", style: { width: 50, height: 50 } },
    ];
    setNodesMock.mockImplementation((updater) => updater(nodes));
    const { result } = renderHook(() => useNodeResize("non-existent-id"));
    act(() => {
      result.current(null, { width: 300, height: 400 });
    });
    const updatedNodes = setNodesMock.mock.calls[0][0](nodes);
    expect(updatedNodes).toEqual(nodes);
  });
  it("preserves existing styles when resizing", () => {
    const nodes = [
      {
        id: "1",
        style: { width: 80, height: 60, backgroundColor: "red" },
      },
    ];
    setNodesMock.mockImplementation((updater) => updater(nodes));
    const { result } = renderHook(() => useNodeResize("1"));
    act(() => {
      result.current(null, { width: 120, height: 140 });
    });
    const updatedNodes = setNodesMock.mock.calls[0][0](nodes);
    expect(updatedNodes[0].style).toEqual({
      width: 120,
      height: 140,
      backgroundColor: "red",
    });
  });
  it("returns a stable callback reference per id", () => {
    const { result, rerender } = renderHook(
      ({ id }) => useNodeResize(id),
      { initialProps: { id: "1" } }
    );
    const firstCallback = result.current;
    rerender({ id: "1" });
    expect(result.current).toBe(firstCallback);
  });
});
 
 