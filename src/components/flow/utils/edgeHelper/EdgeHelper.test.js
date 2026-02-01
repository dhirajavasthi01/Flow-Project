/**
 * Creates a new edge based on the selected edge type
 * @param {Object} params - Edge connection parameters (source, target, etc.)
 * @param {string} selectedEdgeType - Type of edge to create ("straight", "dotted", "dottedArrow", or default)
 * @returns {Object} New edge object with appropriate type and marker configuration
 */
export const createEdge = (params, selectedEdgeType) => {
  const defaultMarkerEnd = {
    type: "arrowclosed",
    width: 10,
    height: 10,
    color: "#000",
  };

  switch (selectedEdgeType) {
    case "straight":
      return {
        ...params,
        type: "flowingPipe",
      };
    case "dotted":
      return {
        ...params,
        type: "flowingPipeDotted",
      };
    case "dottedArrow":
      return {
        ...params,
        type: "flowingPipeDottedArrow",
        markerEnd: defaultMarkerEnd,
      };
    default:
      return {
        ...params,
        type: "flowingPipeStraightArrow",
        markerEnd: defaultMarkerEnd,
      };
  }
};

/**
 * Updates an edge with new configuration
 * @param {Array} edges - Array of current edges
 * @param {string} selectedEdgeId - ID of the edge to update
 * @param {Object} config - Configuration object containing type, markerEnd, and style
 * @returns {Array} Updated array of edges
 */
export const updateEdgeWithConfig = (edges, selectedEdgeId, config) => {
  if (!selectedEdgeId || !config) {
    return edges;
  }

  return edges.map((edge) => {
    if (edge.id === selectedEdgeId) {
      const isDotted =
        config.type === "flowingPipeDotted" ||
        config.type === "flowingPipeDottedArrow";
      
      const updatedEdge = {
        ...edge,
        type: config.type,
        markerEnd: config.markerEnd,
        style: config.style || edge.style,
      };

      // Handle dotted edge styles
      if (isDotted) {
        updatedEdge.style = {
          ...updatedEdge.style,
          strokeDasharray: updatedEdge.style.strokeDasharray || "5,5",
        };
      } else {
        // Remove strokeDasharray for non-dotted edges
        updatedEdge.style = updatedEdge.style || {}
        delete updatedEdge.style.strokeDasharray
      }

      return updatedEdge;
    }
    return edge;
  });
};

 import { describe, it, expect } from "vitest";
import { createEdge, updateEdgeWithConfig } from "./EdgeHelper";

describe("createEdge", () => {
  const baseParams = {
    id: "e1",
    source: "1",
    target: "2",
  };

  it("should create a straight edge", () => {
    const edge = createEdge(baseParams, "straight");

    expect(edge).toEqual({
      ...baseParams,
      type: "flowingPipe",
    });
  });

  it("should create a dotted edge", () => {
    const edge = createEdge(baseParams, "dotted");

    expect(edge).toEqual({
      ...baseParams,
      type: "flowingPipeDotted",
    });
  });

  it("should create a dotted arrow edge with markerEnd", () => {
    const edge = createEdge(baseParams, "dottedArrow");

    expect(edge.type).toBe("flowingPipeDottedArrow");
    expect(edge.markerEnd).toEqual({
      type: "arrowclosed",
      width: 10,
      height: 10,
      color: "#000",
    });
  });

  it("should create default straight arrow edge when type is unknown", () => {
    const edge = createEdge(baseParams, "unknown");

    expect(edge.type).toBe("flowingPipeStraightArrow");
    expect(edge.markerEnd).toBeDefined();
  });
});

describe("updateEdgeWithConfig", () => {
  const edges = [
    {
      id: "e1",
      type: "flowingPipe",
      style: { stroke: "black" },
    },
    {
      id: "e2",
      type: "flowingPipe",
    },
  ];

  it("should return original edges if selectedEdgeId is missing", () => {
    const result = updateEdgeWithConfig(edges, null, {
      type: "flowingPipeDotted",
    });

    expect(result).toBe(edges);
  });

  it("should return original edges if config is missing", () => {
    const result = updateEdgeWithConfig(edges, "e1", null);

    expect(result).toBe(edges);
  });

  it("should update edge type and apply dotted style", () => {
    const result = updateEdgeWithConfig(edges, "e1", {
      type: "flowingPipeDotted",
      style: { stroke: "red" },
    });

    const updatedEdge = result.find(e => e.id === "e1");

    expect(updatedEdge.type).toBe("flowingPipeDotted");
    expect(updatedEdge.style.stroke).toBe("red");
    expect(updatedEdge.style.strokeDasharray).toBe("5,5");
  });

  it("should preserve existing strokeDasharray if already present", () => {
    const customEdges = [
      {
        id: "e1",
        type: "flowingPipe",
        style: { strokeDasharray: "2,2" },
      },
    ];

    const result = updateEdgeWithConfig(customEdges, "e1", {
      type: "flowingPipeDotted",
    });

    expect(result[0].style.strokeDasharray).toBe("2,2");
  });

  it("should remove strokeDasharray for non-dotted edges", () => {
    const dottedEdges = [
      {
        id: "e1",
        type: "flowingPipeDotted",
        style: { strokeDasharray: "5,5" },
      },
    ];

    const result = updateEdgeWithConfig(dottedEdges, "e1", {
      type: "flowingPipe",
    });

    expect(result[0].style.strokeDasharray).toBeUndefined();
  });

  it("should update markerEnd when provided", () => {
    const markerEnd = { type: "arrowclosed" };

    const result = updateEdgeWithConfig(edges, "e2", {
      type: "flowingPipeDottedArrow",
      markerEnd,
    });

    expect(result[1].markerEnd).toEqual(markerEnd);
  });

  it("should not modify non-selected edges", () => {
    const result = updateEdgeWithConfig(edges, "e1", {
      type: "flowingPipeDotted",
    });

    expect(result[1]).toEqual(edges[1]);
  });
});
 