import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNodeProcessing } from "./useNodeProcessing";

/* -------------------- MOCK FLOW FUNCTIONS -------------------- */

vi.mock("../../Flow.functions", () => ({
  processNodesWithTableData: vi.fn((nodes) =>
    nodes.map((n) => ({ ...n, processed: true })),
  ),
  mergeProcessedNodesWithCurrent: vi.fn((processed, current) => processed),
  createTableDataKey: vi.fn((data) => JSON.stringify(data)),
}));

import {
  createTableDataKey,
  processNodesWithTableData,
} from "../../Flow.functions";

/* -------------------- TEST DATA -------------------- */

const nodes = [
  { id: "1", data: { value: 10 }, style: { color: "red" } },
  { id: "2", data: { value: 20 } },
];

const edges = [{ id: "e1", style: { strokeWidth: 2 } }, { id: "e2" }];

/* -------------------- HELPERS -------------------- */

const setup = (overrides = {}) => {
  const setNodes = vi.fn();
  const setEdges = vi.fn();
  const fitView = vi.fn();
  const zoomTo = vi.fn();

  const props = {
    fetchedNodes: nodes,
    fetchedEdges: edges,
    loadingFlow: false,
    error: null,
    saved: false,
    isDeveloperMode: false,
    tableData: [{ a: 1 }],
    actualTime: 100,
    setNodes,
    setEdges,
    fitView,
    zoomTo,
    ...overrides,
  };

  const hook = renderHook(() => useNodeProcessing(props));

  return { ...hook, setNodes, setEdges, fitView, zoomTo };
};

/* -------------------- TESTS -------------------- */

describe("useNodeProcessing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("stores original fetched nodes on initial load", () => {
    const { result } = setup();

    expect(result.current.originalFetchedNodesRef.current.length).toBe(2);
    expect(result.current.originalFetchedNodesRef.current[0].data).not.toBe(
      nodes[0].data,
    );
  });

  it("skips node processing in developer mode", () => {
    const { setNodes } = setup({ isDeveloperMode: true });

    expect(processNodesWithTableData).not.toHaveBeenCalled();
    expect(setNodes).toHaveBeenCalledWith(nodes);
  });

  it("handles error state by clearing nodes and edges", () => {
    const setNodes = vi.fn();
    const setEdges = vi.fn();

    renderHook(() =>
      useNodeProcessing({
        fetchedNodes: [],
        fetchedEdges: [],
        loadingFlow: false,
        error: new Error("fail"),
        saved: false,
        isDeveloperMode: false,
        tableData: [],
        actualTime: 0,
        setNodes,
        setEdges,
        fitView: vi.fn(),
        zoomTo: vi.fn(),
      }),
    );

    expect(setNodes).toHaveBeenCalledWith([]);
    expect(setEdges).toHaveBeenCalledWith([]);
  });

  it("reprocesses nodes when tableData changes", () => {
    const { rerender, setNodes } = setup();

    rerender(() =>
      useNodeProcessing({
        fetchedNodes: nodes,
        fetchedEdges: edges,
        loadingFlow: false,
        error: null,
        saved: false,
        isDeveloperMode: false,
        tableData: [{ a: 2 }],
        actualTime: 100,
        setNodes,
        setEdges: vi.fn(),
        fitView: vi.fn(),
        zoomTo: vi.fn(),
      }),
    );

    expect(createTableDataKey).toHaveBeenCalled();
  });

  it("does not reprocess if tableData key is unchanged", () => {
    const { rerender } = setup();

    rerender(() =>
      useNodeProcessing({
        fetchedNodes: nodes,
        fetchedEdges: edges,
        loadingFlow: false,
        error: null,
        saved: false,
        isDeveloperMode: false,
        tableData: [{ a: 1 }],
        actualTime: 100,
        setNodes: vi.fn(),
        setEdges: vi.fn(),
        fitView: vi.fn(),
        zoomTo: vi.fn(),
      }),
    );
  });

  it("restores original node data when switching to developer mode", () => {
    const setNodes = vi.fn();

    const { rerender } = setup({ setNodes });

    rerender(() =>
      useNodeProcessing({
        fetchedNodes: nodes,
        fetchedEdges: edges,
        loadingFlow: false,
        error: null,
        saved: false,
        isDeveloperMode: true,
        tableData: [],
        actualTime: 100,
        setNodes,
        setEdges: vi.fn(),
        fitView: vi.fn(),
        zoomTo: vi.fn(),
      }),
    );

    expect(setNodes).toHaveBeenCalled();
  });

  it("exposes refs correctly", () => {
    const { result } = setup();

    expect(result.current.originalFetchedNodesRef).toBeDefined();
    expect(result.current.processNodesWithTableDataRef).toBeDefined();
  });
});
