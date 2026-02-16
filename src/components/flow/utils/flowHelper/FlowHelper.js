import { createTableDataKey, mergeProcessedNodesWithCurrent } from "../../Flow.functions";
import { syncNodeDimensions, isResizingRef } from "../../hooks/useNodeResize/useNodeResize";
import { sortNodesByParentChild } from "../parentChildUtils/ParentChildUtils";

// --- Pure helper functions (reduce complexity) ---

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

// Auto-locks nodes with parentId (ensures extent and isAttachedToGroup are set)
function applyAutoLockToNodes(nodes) {
  return nodes.map(node => {
    if (node.parentId) {
      return {
        ...node,
        extent: 'parent',
        data: {
          ...node.data,
          isAttachedToGroup: true
        }
      };
    }
    return node;
  });
}

// Syncs dimensions and applies auto-lock, then sorts nodes
function prepareNodesForDisplay(nodes) {
  const synced = nodes.map(syncNodeDimensions);
  const locked = applyAutoLockToNodes(synced);
  return sortNodesByParentChild(locked);
}

// Gets nodes to use, preferring originalFetchedNodesRef if available
function getNodesToUse(originalFetchedNodesRef, fetchedNodes) {
  return originalFetchedNodesRef.current.length > 0 
    ? originalFetchedNodesRef.current 
    : fetchedNodes;
}

// Gets dimension value from node (checks root, style, then data)
function getNodeDimension(node, dimension) {
  return node[dimension] || node.style?.[dimension] || node.data?.[dimension];
}

// Preserves dimensions when updating a node with original data
function preserveDimensionsForNode(currentNode, originalNode) {
  const currentWidth = getNodeDimension(currentNode, 'width');
  const currentHeight = getNodeDimension(currentNode, 'height');
  const originalWidth = getNodeDimension(originalNode, 'width');
  const originalHeight = getNodeDimension(originalNode, 'height');
  
  const finalWidth = currentWidth || originalWidth;
  const finalHeight = currentHeight || originalHeight;
  
  const updatedNode = {
    ...currentNode,
    width: finalWidth,
    height: finalHeight,
    style: {
      ...currentNode.style,
      width: finalWidth,
      height: finalHeight,
    },
    position: currentNode.position,
    positionAbsolute: currentNode.positionAbsolute,
    parentId: currentNode.parentId,
    data: {
      ...originalNode.data,
      width: finalWidth,
      height: finalHeight,
    },
  };
  
  // Only sync if dimensions are missing
  if (!updatedNode.style?.width || !updatedNode.style?.height) {
    return syncNodeDimensions(updatedNode);
  }
  return updatedNode;
}

// Updates original fetched nodes reference if nodes have changed
// IMPORTANT: Preserves dimensions that were persisted from resize operations
export const updateOriginalFetchedNodesRef = (fetchedNodes, originalFetchedNodesRef) => {
  const currentOriginalIds = originalFetchedNodesRef.current
    .map((n) => n.id)
    .sort()
    .join(",");
  const fetchedIds = fetchedNodes.map((n) => n.id).sort().join(",");

  const shouldUpdate = 
    originalFetchedNodesRef.current.length === 0 ||
    currentOriginalIds !== fetchedIds;
  
  if (!shouldUpdate) {
    return false;
  }

  const existingNodeMap = new Map(
    originalFetchedNodesRef.current.map((node) => [node.id, node])
  );
  
  originalFetchedNodesRef.current = fetchedNodes.map((node) => {
    const existingNode = existingNodeMap.get(node.id);
    
    if (existingNode) {
      const existingWidth = getNodeDimension(existingNode, 'width');
      const existingHeight = getNodeDimension(existingNode, 'height');
      const fetchedWidth = getNodeDimension(node, 'width');
      const fetchedHeight = getNodeDimension(node, 'height');
      
      if (existingWidth !== fetchedWidth || existingHeight !== fetchedHeight) {
        const syncedNode = syncNodeDimensions({
          ...node,
          width: existingWidth,
          height: existingHeight,
          style: {
            ...node.style,
            width: existingWidth,
            height: existingHeight,
          },
          data: {
            ...node.data,
            width: existingWidth,
            height: existingHeight,
          },
        });
        
        return {
          ...syncedNode,
          parentId: existingNode.parentId,
          position: existingNode.position,
          positionAbsolute: existingNode.positionAbsolute,
          data: { ...syncedNode.data },
          style: syncedNode.style ? { ...syncedNode.style } : undefined,
        };
      }
    }
    
    const syncedNode = syncNodeDimensions(node);
    return {
      ...syncedNode,
      data: { ...syncedNode.data },
      style: syncedNode.style ? { ...syncedNode.style } : undefined,
    };
  });
  
  return true;
};

// Processes nodes for normal mode (with table data processing)
function processNodesForNormalMode(nodesToUse, processNodesWithTableDataRef) {
  const processedNodes = processNodesWithTableDataRef.current
    ? processNodesWithTableDataRef.current(nodesToUse, nodesToUse)
    : nodesToUse;
  return prepareNodesForDisplay(processedNodes);
}

// Processes nodes for developer mode (no table data processing)
function processNodesForDeveloperMode(nodesToUse) {
  return prepareNodesForDisplay(nodesToUse);
}

// Handles initial load in normal mode
function handleNormalModeInitialLoad({
  nodesToUse,
  fetchedEdges,
  fetchedLegendPosition,
  processNodesWithTableDataRef,
  setNodes,
  setEdges,
  setLegendPosition,
  zoomTo,
  fitView
}) {
  const sortedNodes = processNodesForNormalMode(nodesToUse, processNodesWithTableDataRef);
  const processedEdges = processEdges(fetchedEdges, 1);
  setNodes(sortedNodes);
  setEdges(processedEdges);
  setLegendPosition(fetchedLegendPosition);
  
  setTimeout(() => {
    zoomTo(0.5);
    fitView({ duration: 800 });
  }, 100);
}

// Handles initial load in developer mode
function handleDeveloperModeInitialLoad({
  nodesToUse,
  fetchedEdges,
  fetchedLegendPosition,
  setNodes,
  setEdges,
  setLegendPosition
}) {
  const sortedNodes = processNodesForDeveloperMode(nodesToUse);
  setNodes(sortedNodes);
  setLegendPosition(fetchedLegendPosition);
  setEdges(processEdges(fetchedEdges, 5));
}

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
  if (error) {
    setNodes([]);
    setEdges([]);
    setLegendPosition(fetchedLegendPosition);
    return { shouldUpdate: false };
  }

  if (fetchedNodes.length === 0 || loadingFlow) {
    return { shouldUpdate: false };
  }

  updateOriginalFetchedNodesRef(fetchedNodes, originalFetchedNodesRef);
  const nodesToUse = getNodesToUse(originalFetchedNodesRef, fetchedNodes);
  
  if (!isDeveloperMode) {
    handleNormalModeInitialLoad({
      nodesToUse,
      fetchedEdges,
      fetchedLegendPosition,
      processNodesWithTableDataRef,
      setNodes,
      setEdges,
      setLegendPosition,
      zoomTo,
      fitView
    });
  } else {
    handleDeveloperModeInitialLoad({
      nodesToUse,
      fetchedEdges,
      fetchedLegendPosition,
      setNodes,
      setEdges,
      setLegendPosition
    });
  }

  return { shouldUpdate: true };
};

// Processes nodes with table data and merges with current nodes
function processAndMergeNodesWithTableData({
  originalFetchedNodesRef,
  processNodesWithTableDataRef,
  currentNodes
}) {
  const processedNodes = processNodesWithTableDataRef.current
    ? processNodesWithTableDataRef.current(
        originalFetchedNodesRef.current,
        originalFetchedNodesRef.current
      )
    : originalFetchedNodesRef.current;
  
  const preparedNodes = prepareNodesForDisplay(processedNodes);
  return mergeProcessedNodesWithCurrent(preparedNodes, currentNodes);
}

// Handles table data change in normal mode
function handleTableDataChangeNormalMode({
  tableData,
  originalFetchedNodesRef,
  lastProcessedTableDataRef,
  processNodesWithTableDataRef,
  setNodes
}) {
  const tableDataKey = createTableDataKey(tableData);
  
  if (lastProcessedTableDataRef.current === tableDataKey) {
    return { shouldUpdate: false };
  }
  
  lastProcessedTableDataRef.current = tableDataKey;
  
  setNodes((currentNodes) => {
    const merged = processAndMergeNodesWithTableData({
      originalFetchedNodesRef,
      processNodesWithTableDataRef,
      currentNodes
    });
    return sortNodesByParentChild(merged);
  });
  
  return { shouldUpdate: true };
}

// Restores nodes with original data while preserving dimensions
function restoreNodesWithOriginalData(currentNodes, originalFetchedNodesRef) {
  if (currentNodes.length > 0) {
    const originalNodeMap = new Map(
      originalFetchedNodesRef.current.map((node) => [node.id, node])
    );
    const result = currentNodes.map((currentNode) => {
      const originalNode = originalNodeMap.get(currentNode.id);
      if (originalNode) {
        return preserveDimensionsForNode(currentNode, originalNode);
      }
      return currentNode;
    });
    return prepareNodesForDisplay(result);
  }
  
  const nodesToUse = originalFetchedNodesRef.current.length > 0 
    ? originalFetchedNodesRef.current 
    : [];
  return prepareNodesForDisplay(nodesToUse);
}

// Handles developer mode restoration
function handleDeveloperModeRestore({
  originalFetchedNodesRef,
  lastProcessedTableDataRef,
  setNodes
}) {
  const wasInDeveloperMode = lastProcessedTableDataRef.current === "DEVELOPER_MODE";
  if (wasInDeveloperMode) {
    return { shouldUpdate: false };
  }
  
  lastProcessedTableDataRef.current = "DEVELOPER_MODE";
  
  setNodes((currentNodes) => 
    restoreNodesWithOriginalData(currentNodes, originalFetchedNodesRef)
  );
  
  return { shouldUpdate: true };
}

//Handles the effect when table data or developer mode changes
export const handleTableDataChange = ({
  tableData,
  isDeveloperMode,
  originalFetchedNodesRef,
  lastProcessedTableDataRef,
  processNodesWithTableDataRef,
  setNodes,
}) => {  
  if (isResizingRef?.current) {
    return { shouldUpdate: false };
  }
  
  if (originalFetchedNodesRef.current.length === 0) {
    return { shouldUpdate: false };
  }
  
  if (!isDeveloperMode) {
    return handleTableDataChangeNormalMode({
      tableData,
      originalFetchedNodesRef,
      lastProcessedTableDataRef,
      processNodesWithTableDataRef,
      setNodes
    });
  }
  
  return handleDeveloperModeRestore({
    originalFetchedNodesRef,
    lastProcessedTableDataRef,
    setNodes
  });
};
