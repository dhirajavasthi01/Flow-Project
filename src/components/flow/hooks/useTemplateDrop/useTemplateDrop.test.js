import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTemplateDrop } from "./useTemplateDrop";
 
vi.mock("../useTemplateManager/useTemplateManager", () => ({
  useTemplateManager: () => ({
    getTemplate: mockGetTemplate,
  }),
}));
vi.mock("../../../../utills/flowUtills/FlowUtills", () => ({
  generateRandom8DigitNumber: () => 12345678,
}));
let mockGetTemplate;
 
const sampleTemplate = {
  nodes: [
    {
      id: "n1",
      nodeType: "TypeA",
      position: { x: 10, y: 10 },
    },
    {
      id: "n2",
      nodeType: "TypeB",
      position: { x: 30, y: 30 },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "n1",
      target: "n2",
      sourceHandle: "n1-bottom",
      targetHandle: "n2-top",
    },
  ],
};
 
describe("useTemplateDrop", () => {
  beforeEach(() => {
    mockGetTemplate = vi.fn();
  });
  it("should throw error when template not found", () => {
    mockGetTemplate.mockReturnValue(undefined);
    const { result } = renderHook(() => useTemplateDrop());
    expect(() =>
      result.current.cloneTemplate("unknown", { x: 100, y: 100 })
    ).toThrowError("Template with ID unknown not found");
  });
  it("should clone nodes with new IDs & updated positions", () => {
    mockGetTemplate.mockReturnValue(sampleTemplate);
    const { result } = renderHook(() => useTemplateDrop());
    const { nodes } = result.current.cloneTemplate(
      "template1",
      { x: 100, y: 200 },
      { x: 20, y: 20 }
    );
    expect(nodes.length).toBe(2);
 
    expect(nodes[0].id).toMatch(/TypeA-12345678/);
    expect(nodes[1].id).toMatch(/TypeB-12345678/);
 
    expect(nodes[0].position).toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      })
    );
  });
  it("should clone edges and remap source/target and handles", () => {
    mockGetTemplate.mockReturnValue(sampleTemplate);
    const { result } = renderHook(() => useTemplateDrop());
    const { edges } = result.current.cloneTemplate(
      "template1",
      { x: 0, y: 0 },
      { x: 20, y: 20 }
    );
    expect(edges.length).toBe(1);
    const edge = edges[0];
 
    expect(edge.source).toMatch(/TypeA-12345678/);
    expect(edge.target).toMatch(/TypeB-12345678/);
 
    expect(edge.sourceHandle.startsWith(edge.source)).toBe(true);
    expect(edge.targetHandle.startsWith(edge.target)).toBe(true);
 
    expect(edge.id).toContain("xy-edge__");
  });
  it("should filter edge if source/target not found in nodeIdMap", () => {
    const badTemplate = {
      ...sampleTemplate,
      edges: [
        {
          id: "bad",
          source: "nope",
          target: "n2",
          sourceHandle: "nope-h1",
          targetHandle: "n2-h2",
        },
      ],
    };
    mockGetTemplate.mockReturnValue(badTemplate);
    const { result } = renderHook(() => useTemplateDrop());
    const { edges } = result.current.cloneTemplate("t1", { x: 0, y: 0 });
    expect(edges.length).toBe(0);
  });
  it("should calculate offset with multiplier", () => {
    const { result } = renderHook(() => useTemplateDrop());
    expect(result.current.calculateOffset(0)).toEqual({ x: 20, y: 20 });
    expect(result.current.calculateOffset(3)).toEqual({ x: 40, y: 40 });
    expect(result.current.calculateOffset(6)).toEqual({ x: 60, y: 60 });
  });
  it("should execute full drop flow successfully", () => {
    mockGetTemplate.mockReturnValue(sampleTemplate);
    const onNodesAdd = vi.fn();
    const onEdgesAdd = vi.fn();
    const { result } = renderHook(() => useTemplateDrop());
    const output = result.current.handleTemplateDrop(
      "template1",
      { x: 50, y: 50 },
      onNodesAdd,
      onEdgesAdd,
      0
    );
    expect(output.success).toBe(true);
    expect(onNodesAdd).toHaveBeenCalled();
    expect(onEdgesAdd).toHaveBeenCalled();
  });
  it("should return error when cloneTemplate fails", () => {
    mockGetTemplate.mockReturnValue(undefined);
    const { result } = renderHook(() => useTemplateDrop());
    const output = result.current.handleTemplateDrop(
      "badID",
      { x: 0, y: 0 },
      vi.fn(),
      vi.fn()
    );
    expect(output.success).toBe(false);
    expect(output.error).toContain("Template with ID badID not found");
  });
});
 