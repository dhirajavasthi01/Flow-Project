import { createTableDataKey, mergeProcessedNodesWithCurrent } from "../../Flow.functions";

// Processes edges with default styling
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

// Updates original fetched nodes reference if nodes have changed
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

//Handles the effect when fetched nodes/edges change
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

//Handles the effect when table data or developer mode changes
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
 
