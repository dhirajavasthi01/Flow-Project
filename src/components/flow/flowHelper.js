import { createTableDataKey, mergeProcessedNodesWithCurrent } from "./Flow.functions";

/**
 * Processes edges with default styling
 * @param {Array} edges - Array of edges to process
 * @param {number} strokeWidth - Stroke width for edges (default: 1)
 * @returns {Array} Processed edges with styling
 */
export const processEdges = (edges, strokeWidth = 1) => {
  return edges.map((edge) => ({
    ...edge,
    style: {
      stroke: "#000000",
      ...edge.style,
      strokeWidth: edge.style?.strokeWidth || strokeWidth,
    },
  }));
};

/**
 * Updates original fetched nodes reference if nodes have changed
 * @param {Array} fetchedNodes - Newly fetched nodes
 * @param {Object} originalFetchedNodesRef - Ref object containing original nodes
 * @returns {boolean} True if nodes were updated, false otherwise
 */
export const updateOriginalFetchedNodesRef = (fetchedNodes, originalFetchedNodesRef) => {
  const currentOriginalIds = originalFetchedNodesRef.current
    .map((n) => n.id)
    .sort()
    .join(",");
  const fetchedIds = fetchedNodes.map((n) => n.id).sort().join(",");

  if (
    originalFetchedNodesRef.current.length === 0 ||
    currentOriginalIds !== fetchedIds
  ) {
    originalFetchedNodesRef.current = fetchedNodes.map((node) => ({
      ...node,
      data: { ...node.data },
      style: node.style ? { ...node.style } : undefined,
    }));
    return true;
  }
  return false;
};

/**
 * Handles the effect when fetched nodes/edges change
 * @param {Object} params - Parameters object
 * @param {Array} params.fetchedNodes - Fetched nodes from API
 * @param {Array} params.fetchedEdges - Fetched edges from API
 * @param {Object} params.fetchedLegendPosition - Legend position
 * @param {boolean} params.loadingFlow - Loading state
 * @param {Object} params.error - Error object if any
 * @param {boolean} params.isDeveloperMode - Developer mode flag
 * @param {Object} params.originalFetchedNodesRef - Ref for original nodes
 * @param {Function} params.processNodesWithTableDataRef - Ref for processing function
 * @param {Function} params.setNodes - Setter for nodes state
 * @param {Function} params.setEdges - Setter for edges state
 * @param {Function} params.setLegendPosition - Setter for legend position
 * @param {Function} params.zoomTo - Function to zoom to a level
 * @param {Function} params.fitView - Function to fit view
 * @returns {Object} Object with shouldUpdate flag and any side effects
 */
export const handleFetchedNodesEdgesChange = ({
  fetchedNodes,
  fetchedEdges,
  fetchedLegendPosition,
  loadingFlow,
  error,
  isDeveloperMode,
  originalFetchedNodesRef,
  processNodesWithTableDataRef,
  setNodes,
  setEdges,
  setLegendPosition,
  zoomTo,
  fitView,
}) => {
  // Handle error state
  if (error) {
    console.error("Error loading flow data:", error);
    setNodes([]);
    setEdges([]);
    setLegendPosition(fetchedLegendPosition);
    return { shouldUpdate: false };
  }

  // Only process if we have nodes and not loading
  if (fetchedNodes.length === 0 || loadingFlow) {
    return { shouldUpdate: false };
  }

  // Update original fetched nodes reference if needed
  updateOriginalFetchedNodesRef(fetchedNodes, originalFetchedNodesRef);

  // Process nodes and edges based on developer mode
  if (!isDeveloperMode) {
    const processedNodes = processNodesWithTableDataRef.current
      ? processNodesWithTableDataRef.current(fetchedNodes, fetchedNodes)
      : fetchedNodes;
    const processedEdges = processEdges(fetchedEdges, 1);
    
    setNodes(processedNodes);
    setEdges(processedEdges);
    setLegendPosition(fetchedLegendPosition);
    
    // Zoom and fit view after a short delay
    setTimeout(() => {
      zoomTo(0.5);
      fitView({ duration: 800 });
    }, 100);
  } else {
    setNodes(fetchedNodes);
    setLegendPosition(fetchedLegendPosition);
    const processedEdges = processEdges(fetchedEdges, 5);
    setEdges(processedEdges);
  }

  return { shouldUpdate: true };
};

/**
 * Handles the effect when table data or developer mode changes
 * @param {Object} params - Parameters object
 * @param {Array} params.tableData - Table data array
 * @param {boolean} params.isDeveloperMode - Developer mode flag
 * @param {Object} params.originalFetchedNodesRef - Ref for original nodes
 * @param {Object} params.lastProcessedTableDataRef - Ref for last processed table data key
 * @param {Function} params.processNodesWithTableDataRef - Ref for processing function
 * @param {Function} params.setNodes - Setter for nodes state (with updater function support)
 * @returns {Object} Object with shouldUpdate flag
 */
export const handleTableDataChange = ({
  tableData,
  isDeveloperMode,
  originalFetchedNodesRef,
  lastProcessedTableDataRef,
  processNodesWithTableDataRef,
  setNodes,
}) => {
  // Only process if we have original nodes
  if (originalFetchedNodesRef.current.length === 0) {
    return { shouldUpdate: false };
  }

  // Handle non-developer mode: process nodes with table data
  if (!isDeveloperMode) {
    const tableDataKey = createTableDataKey(tableData);
    
    // Skip if table data hasn't changed
    if (lastProcessedTableDataRef.current === tableDataKey) {
      return { shouldUpdate: false };
    }
    
    lastProcessedTableDataRef.current = tableDataKey;
    
    setNodes((currentNodes) => {
      const processedNodes = processNodesWithTableDataRef.current
        ? processNodesWithTableDataRef.current(
            originalFetchedNodesRef.current,
            originalFetchedNodesRef.current
          )
        : originalFetchedNodesRef.current;
      return mergeProcessedNodesWithCurrent(processedNodes, currentNodes);
    });
    
    return { shouldUpdate: true };
  }

  // Handle developer mode: reset to original nodes
  const wasInDeveloperMode =
    lastProcessedTableDataRef.current === "DEVELOPER_MODE";
  
  if (!wasInDeveloperMode) {
    lastProcessedTableDataRef.current = "DEVELOPER_MODE";
    
    setNodes((currentNodes) => {
      if (currentNodes.length > 0) {
        const originalNodeMap = new Map(
          originalFetchedNodesRef.current.map((node) => [node.id, node])
        );
        return currentNodes.map((currentNode) => {
          const originalNode = originalNodeMap.get(currentNode.id);
          if (originalNode) {
            return {
              ...currentNode,
              data: originalNode.data,
            };
          }
          return currentNode;
        });
      }
      return originalFetchedNodesRef.current;
    });
    
    return { shouldUpdate: true };
  }

  return { shouldUpdate: false };
};
