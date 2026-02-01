import { describe, test, expect, vi, beforeEach } from "vitest";
import { useNodeCommon } from "./useNodeCommon";
 

vi.mock(import("jotai"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn(),
  }
})
 
vi.mock("@xyflow/react", () => ({
  useReactFlow: vi.fn(),
}));
 
import { useAtomValue } from "jotai";
import { useReactFlow } from "@xyflow/react";
describe("useNodeCommon - Pure Vitest Test", () => {
  const mockSetNodes = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    useReactFlow.mockReturnValue({ setNodes: mockSetNodes });
  });
  test("returns correct computed values when tagData exists", () => {
 
    useAtomValue
      .mockReturnValueOnce("node-1")
      .mockReturnValueOnce([
        { tagId: "T1", actual: 1 },
        { tagId: "T2", actual: 0 },
      ])
      .mockReturnValueOnce("HVAC")
      .mockReturnValueOnce(true);
    const data = {
      subSystem: "HVAC",
      linkedTag: "T1",
      isActive: false,
    };
    const result = useNodeCommon("node-1", data);
    expect(result.selectedId).toBe("node-1");
    expect(result.isDeveloperMode).toBe(true);
    expect(result.isHighlighted).toBe(true);
    expect(result.tagData).toEqual({ tagId: "T1", actual: 1 });
    expect(result.isNodeActive).toBe(true);
    expect(result.isSelected).toBe(true);
    expect(result.setNodes).toBe(mockSetNodes);
  });
  test("handles missing tagData and uses isActive fallback", () => {
    useAtomValue
      .mockReturnValueOnce("node-x")
      .mockReturnValueOnce([])
      .mockReturnValueOnce("Fire")
      .mockReturnValueOnce(false);
    const data = {
      subSystem: "HVAC",
      linkedTag: "UNKNOWN",
      isActive: true,
    };
    const result = useNodeCommon("node-1", data);
    expect(result.tagData).toBeUndefined();
    expect(result.isNodeActive).toBe(true);
    expect(result.isSelected).toBe(false);
    expect(result.isHighlighted).toBe(false);
  });
  test("handles null data safely", () => {
    useAtomValue
      .mockReturnValueOnce(null)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(false);
    const result = useNodeCommon("N1", null);
    expect(result.tagData).toBeUndefined();
    expect(result.isHighlighted).toBe(false);
    expect(result.isNodeActive).toBe(undefined);
    expect(result.isSelected).toBe(false);
  });
  test("highlighting works only when subsystem = highlightedNodeType", () => {
    useAtomValue
      .mockReturnValueOnce("123")
      .mockReturnValueOnce([])
      .mockReturnValueOnce("SYS-A")
      .mockReturnValueOnce(true);
    const data = {
      subSystem: "SYS-B",
      linkedTag: null,
      isActive: false,
    };
    const result = useNodeCommon("999", data);
    expect(result.isHighlighted).toBe(false);
  });
});
 