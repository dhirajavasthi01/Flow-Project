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
          strokeDasharray: updatedEdge?.style?.strokeDasharray || "5,5",
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

 