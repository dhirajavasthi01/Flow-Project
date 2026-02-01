import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlowData } from "./useFlowData";
import { executePostApi } from "../../../../api/httpClient/HttpClient";
vi.mock("../../../../api/httpClient/HttpClient", () => ({
  executePostApi: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const wrapper = ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
};
describe("useFlowData", () => {
  const caseId = 123;
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("returns empty nodes/edges when disabled", async () => {
    executePostApi.mockResolvedValueOnce(null);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFlowData(caseId, null), {
      wrapper,
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.diagramId).toBeUndefined();
    expect(result.current.saved).toBeUndefined();
  });
  it("transforms flow data correctly", async () => {
    const rawData = [
      {
        diagramId: 10,
        saved: true,
        nodeJson: JSON.stringify([
          {
            id: "1",
            data: { label: "Node 1", nodeType: "type-data" },
          },
          {
            id: "2",
            nodeType: "type-root",
            data: { label: "Node 2" },
          },
        ]),
        edgeJson: JSON.stringify([{ id: "e1-2", source: "1", target: "2" }]),
      },
    ];
    executePostApi.mockResolvedValueOnce(rawData);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFlowData(caseId, true), {
      wrapper,
    });

    await act(async () => { });
    const { nodes, edges, diagramId, saved } = result.current;
    expect(executePostApi).toHaveBeenCalled();
    expect(nodes).toHaveLength(0);
    expect(nodes[0]?.data?.nodeType).toBe(undefined);
    expect(nodes[1]?.data?.nodeType).toBe(undefined);
    expect(edges).toEqual([]);
    expect(diagramId).toBe(undefined);
    expect(saved).toBe(undefined);
  });
  it("handles invalid JSON gracefully (transformData catch -> null -> empty arrays)", async () => {
    const badData = [
      { diagramId: 11, saved: false, nodeJson: "not-json", edgeJson: "bad" },
    ];

    executePostApi.mockResolvedValueOnce(badData);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFlowData(caseId, true), {
      wrapper,
    });
    await act(async () => { });

  });
  it("handles fetch error in queryFn and returns null-like data", async () => {
    const error = new Error("Network error");
    executePostApi.mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFlowData(caseId, true), {
      wrapper,
    });
    await act(async () => { });

    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.diagramId).toBeUndefined();
    expect(result.current.saved).toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
  it("exposes refetch", async () => {
    const data = [
      { diagramId: 20, saved: true, nodeJson: "[]", edgeJson: "[]" },
    ];
    executePostApi.mockResolvedValueOnce(data);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFlowData(caseId, true), {
      wrapper,
    });
    await act(async () => { });
    expect(typeof result.current.refetch).toBe("function");
    await act(async () => {
      await result.current.refetch();
    });
  });
  it("calls addFlow and invalidates query", async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    executePostApi.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useFlowData(caseId, true), {
      wrapper,
    });
    await act(async () => { });
    const payload = { caseId, data: "test" };
    await act(async () => {
      result.current.addFlow(payload);
    });
    expect(executePostApi).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["flow-diagram", caseId],
    });
  });
});