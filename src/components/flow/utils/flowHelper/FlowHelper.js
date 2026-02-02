import { createTableDataKey, mergeProcessedNodesWithCurrent } from "../../Flow.functions";
import { syncNodeDimensions, isResizingRef } from "../../hooks/useNodeResize/useNodeResize";
import { sortNodesByParentChild } from "../parentChildUtils/ParentChildUtils";

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
// IMPORTANT: Preserves dimensions that were persisted from resize operations
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
    // Create a map of existing nodes to preserve persisted dimensions
    const existingNodeMap = new Map(
      originalFetchedNodesRef.current.map((node) => [node.id, node])
    );
    
    // Sync dimensions from data to style for backward compatibility
    // BUT: Preserve dimensions from existing nodes if they exist (from resize operations)
    originalFetchedNodesRef.current = fetchedNodes.map((node) => {
      const existingNode = existingNodeMap.get(node.id);
      
      // If we have an existing node with persisted dimensions, preserve them
      if (existingNode) {
        const existingWidth = existingNode.width || existingNode.data?.width || existingNode.style?.width;
        const existingHeight = existingNode.height || existingNode.data?.height || existingNode.style?.height;
        const fetchedWidth = node.width || node.data?.width || node.style?.width;
        const fetchedHeight = node.height || node.data?.height || node.style?.height;
        
        // If dimensions differ, use the existing (persisted) dimensions
        // This ensures resize changes are not lost when nodes are refetched
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
            // Preserve other properties from existing node (parentId, position, etc.)
            parentId: existingNode.parentId,
            position: existingNode.position,
            positionAbsolute: existingNode.positionAbsolute,
            data: { ...syncedNode.data },
            style: syncedNode.style ? { ...syncedNode.style } : undefined,
          };
        }
      }
      
      // New node or dimensions match - use fetched node
      const syncedNode = syncNodeDimensions(node);
      return {
        ...syncedNode,
        data: { ...syncedNode.data },
        style: syncedNode.style ? { ...syncedNode.style } : undefined,
      };
    });
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
  // This preserves persisted dimensions from resize operations
  updateOriginalFetchedNodesRef(fetchedNodes, originalFetchedNodesRef);

  // IMPORTANT: Use originalFetchedNodesRef.current instead of fetchedNodes
  // This ensures persisted dimensions from resize operations are applied
  const nodesToUse = originalFetchedNodesRef.current.length > 0 
    ? originalFetchedNodesRef.current 
    : fetchedNodes;
  
  // Process nodes and edges based on developer mode
  if (!isDeveloperMode) {
    const processedNodes = processNodesWithTableDataRef.current
      ? processNodesWithTableDataRef.current(nodesToUse, nodesToUse)
      : nodesToUse;
    // Sync dimensions from data to style for backward compatibility
    const nodesWithSyncedDimensions = processedNodes.map(syncNodeDimensions);
    // Auto-lock nodes with parentId (ensure extent and isAttachedToGroup are set)
    const nodesWithLockState = nodesWithSyncedDimensions.map(node => {
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
    // Ensure parent-child ordering
    const sortedNodes = sortNodesByParentChild(nodesWithLockState);
    const processedEdges = processEdges(fetchedEdges, 1);
    setNodes(sortedNodes);
    setEdges(processedEdges);
    setLegendPosition(fetchedLegendPosition);
    
    // Zoom and fit view after a short delay
    setTimeout(() => {
      zoomTo(0.5);
      fitView({ duration: 800 });
    }, 100);
  } else {
    // IMPORTANT: Use originalFetchedNodesRef.current instead of fetchedNodes
    // This ensures persisted dimensions from resize operations are applied
    const nodesToUse = originalFetchedNodesRef.current.length > 0 
      ? originalFetchedNodesRef.current 
      : fetchedNodes;
    
    // Sync dimensions from data to style for backward compatibility
    const nodesWithSyncedDimensions = nodesToUse.map(syncNodeDimensions);
    // Auto-lock nodes with parentId (ensure extent and isAttachedToGroup are set)
    const nodesWithLockState = nodesWithSyncedDimensions.map(node => {
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
    // Ensure parent-child ordering
    const sortedNodes = sortNodesByParentChild(nodesWithLockState);
    setNodes(sortedNodes);
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
  console.log('[handleTableDataChange] Called:', {
    isDeveloperMode,
    hasOriginalNodes: originalFetchedNodesRef.current.length > 0,
    isResizing: isResizingRef?.current,
    originalNodesCount: originalFetchedNodesRef.current.length
  });
  
  // Skip if a node is currently being resized to prevent interference
  if (isResizingRef?.current) {
    console.log('[handleTableDataChange] Skipping - node is resizing');
    return { shouldUpdate: false };
  }
  
  // Only process if we have original nodes
  if (originalFetchedNodesRef.current.length === 0) {
    console.log('[handleTableDataChange] Skipping - no original nodes');
    return { shouldUpdate: false };
  }
  
  console.log('[handleTableDataChange] Original nodes positions:', originalFetchedNodesRef.current.map(n => ({
    id: n.id,
    parentId: n.parentId,
    position: n.position,
    positionAbsolute: n.positionAbsolute
  })));

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
      // Sync dimensions from data to style for backward compatibility
      const nodesWithSyncedDimensions = processedNodes.map(syncNodeDimensions);
      // Auto-lock nodes with parentId (ensure extent and isAttachedToGroup are set)
      const nodesWithLockState = nodesWithSyncedDimensions.map(node => {
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
      const merged = mergeProcessedNodesWithCurrent(nodesWithLockState, currentNodes);
      // Ensure parent-child ordering
      return sortNodesByParentChild(merged);
    });
    
    return { shouldUpdate: true };
  }

  // Handle developer mode: reset to original nodes
  // IMPORTANT: Only reset when first entering developer mode, not on every node update
  // This prevents resize changes from being lost
  const wasInDeveloperMode =
    lastProcessedTableDataRef.current === "DEVELOPER_MODE";
  
  console.log('[handleTableDataChange] Developer mode check:', {
    wasInDeveloperMode,
    lastProcessedTableDataRef: lastProcessedTableDataRef.current
  });
  
  if (!wasInDeveloperMode) {
    console.log('[handleTableDataChange] First time entering developer mode - resetting nodes');
    lastProcessedTableDataRef.current = "DEVELOPER_MODE";
    
    setNodes((currentNodes) => {
      console.log('[handleTableDataChange] Current nodes before reset:', currentNodes.map(n => ({
        id: n.id,
        parentId: n.parentId,
        position: n.position,
        positionAbsolute: n.positionAbsolute
      })));
      
      if (currentNodes.length > 0) {
        const originalNodeMap = new Map(
          originalFetchedNodesRef.current.map((node) => [node.id, node])
        );
        const result = currentNodes.map((currentNode) => {
          const originalNode = originalNodeMap.get(currentNode.id);
          if (originalNode) {
            console.log('[handleTableDataChange] Processing node:', {
              id: currentNode.id,
              currentParentId: currentNode.parentId,
              originalParentId: originalNode.parentId,
              currentPosition: currentNode.position,
              originalPosition: originalNode.position
            });
            // Preserve current node's dimensions (width, height, style) when resetting data
            // This prevents resize changes from being lost when switching to developer mode
            // CRITICAL: Preserve manually resized dimensions - don't let syncNodeDimensions reset them
            // CRITICAL: Get dimensions from root first (most reliable), then style, then data
            // This ensures we use the actual resized dimensions, not stale data dimensions
            const currentWidth = currentNode.width || currentNode.style?.width || currentNode.data?.width;
            const currentHeight = currentNode.height || currentNode.style?.height || currentNode.data?.height;
            
            // CRITICAL: Get original dimensions from originalFetchedNodesRef (which has persisted dimensions)
            const originalWidth = originalNode.width || originalNode.style?.width || originalNode.data?.width;
            const originalHeight = originalNode.height || originalNode.style?.height || originalNode.data?.height;
            
            // CRITICAL: Use current dimensions if they exist, otherwise use original (persisted) dimensions
            // This prevents resetting to old dimensions when current node has been resized
            const finalWidth = currentWidth || originalWidth;
            const finalHeight = currentHeight || originalHeight;
            
            const updatedNode = {
              ...currentNode,
              // Preserve dimensions that may have been changed by resize
              // Use current dimensions if available, otherwise use persisted original dimensions
              width: finalWidth,
              height: finalHeight,
              style: {
                ...currentNode.style,
                width: finalWidth,
                height: finalHeight,
              },
              // CRITICAL: Preserve current position and parentId to maintain re-parenting
              position: currentNode.position,
              positionAbsolute: currentNode.positionAbsolute,
              parentId: currentNode.parentId, // Preserve parent-child relationships
              data: {
                ...originalNode.data,
                width: finalWidth,
                height: finalHeight,
              },
            };
            
            console.log('[handleTableDataChange] Updated node:', {
              id: updatedNode.id,
              parentId: updatedNode.parentId,
              position: updatedNode.position,
              positionAbsolute: updatedNode.positionAbsolute,
              preservedFromCurrent: {
                parentId: currentNode.parentId,
                position: currentNode.position
              }
            });
            
            // Only sync if dimensions are missing - don't overwrite existing dimensions
            if (!updatedNode.style?.width || !updatedNode.style?.height) {
              return syncNodeDimensions(updatedNode);
            }
            return updatedNode;
          }
          return currentNode;
        });
        
        console.log('[handleTableDataChange] Result nodes after reset:', result.map(n => ({
          id: n.id,
          parentId: n.parentId,
          position: n.position,
          positionAbsolute: n.positionAbsolute
        })));
        
        // Auto-lock nodes with parentId (ensure extent and isAttachedToGroup are set)
        const nodesWithLockState = result.map(node => {
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
        
        // Ensure parent-child ordering
        return sortNodesByParentChild(nodesWithLockState);
      }
      // IMPORTANT: Use originalFetchedNodesRef.current which has persisted dimensions
      // Sync dimensions from data to style for backward compatibility
      const nodesToUse = originalFetchedNodesRef.current.length > 0 
        ? originalFetchedNodesRef.current 
        : [];
      const syncedNodes = nodesToUse.map(syncNodeDimensions);
      // Auto-lock nodes with parentId (ensure extent and isAttachedToGroup are set)
      const nodesWithLockState = syncedNodes.map(node => {
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
      console.log('[handleTableDataChange] Synced nodes (no current nodes):', nodesWithLockState.map(n => ({
        id: n.id,
        parentId: n.parentId,
        position: n.position,
        positionAbsolute: n.positionAbsolute
      })));
      // Ensure parent-child ordering
      return sortNodesByParentChild(nodesWithLockState);
    });
    
    return { shouldUpdate: true };
  } else {
    // Already in developer mode - don't reset nodes
    // This prevents resize changes from being lost
    console.log('[handleTableDataChange] Already in developer mode - skipping reset');
  }

  return { shouldUpdate: false };
};
 
