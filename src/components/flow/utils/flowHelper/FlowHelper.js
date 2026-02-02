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
  getNodes, // Add getNodes to access current nodes
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
    // CRITICAL: Use setNodes callback to access current nodes state directly
    // This ensures we always use the most up-to-date nodes with correct positions
    setNodes((currentNodes) => {
      // Use current nodes if available (to preserve positions), otherwise use nodesToUse
      const baseNodes = currentNodes.length > 0 ? currentNodes : nodesToUse;
      
      const processedNodes = processNodesWithTableDataRef.current
        ? processNodesWithTableDataRef.current(baseNodes, nodesToUse) // Use baseNodes for positions, nodesToUse for data restoration
        : baseNodes;
      // Sync dimensions from data to style for backward compatibility
      // CRITICAL: syncNodeDimensions now explicitly preserves positions
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
      // CRITICAL: Merge with current nodes to ensure all current properties (especially positions) are preserved
      // This is a safety measure - even though processedNodes uses baseNodes (which are currentNodes),
      // merging ensures positions are definitely preserved from the actual current state
      const mergedNodes = currentNodes.length > 0 
        ? mergeProcessedNodesWithCurrent(nodesWithLockState, currentNodes)
        : nodesWithLockState;
      // Ensure parent-child ordering
      return sortNodesByParentChild(mergedNodes);
    });
    const processedEdges = processEdges(fetchedEdges, 1);
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
  // Skip if a node is currently being resized to prevent interference
  if (isResizingRef?.current) {
    return { shouldUpdate: false };
  }
  
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
      // Use currentNodes as the base to preserve positions (especially relative positions for child nodes)
      // Only use originalFetchedNodesRef for color/highlighting data restoration
      const processedNodes = processNodesWithTableDataRef.current
        ? processNodesWithTableDataRef.current(
            currentNodes, // Use current nodes to preserve positions
            originalFetchedNodesRef.current // Use original nodes for data restoration
          )
        : currentNodes;
      // Sync dimensions from data to style for backward compatibility
      const nodesWithSyncedDimensions = processedNodes.map(syncNodeDimensions);
      // Auto-lock nodes with parentId (ensure extent and isAttachedToGroup are set)
      // CRITICAL: Only set these if they're not already set to avoid triggering unnecessary updates
      const nodesWithLockState = nodesWithSyncedDimensions.map(node => {
        if (node.parentId) {
          // Only update if extent or isAttachedToGroup is not already set correctly
          const needsExtent = node.extent !== 'parent';
          const needsIsAttachedToGroup = node.data?.isAttachedToGroup !== true;
          
          if (needsExtent || needsIsAttachedToGroup) {
            return {
              ...node,
              extent: 'parent',
              data: {
                ...node.data,
                isAttachedToGroup: true
              }
            };
          }
        }
        return node;
      });
      // Merge processed nodes with current nodes to preserve all properties
      const merged = mergeProcessedNodesWithCurrent(nodesWithLockState, currentNodes);
      
      // CRITICAL: Check if nodes actually changed before updating
      // This prevents unnecessary setNodes calls that trigger position recalculation
      const currentNodeMap = new Map(currentNodes.map(n => [n.id, n]));
      let nodesChanged = false;
      const changedNodes = [];
      
      merged.forEach((mergedNode) => {
        const currentNode = currentNodeMap.get(mergedNode.id);
        if (!currentNode) {
          nodesChanged = true;
          changedNodes.push({ id: mergedNode.id, reason: 'new node' });
          return;
        }
        
        // Check if data changed (colors, highlighting, etc.)
        // Only compare relevant data properties, not all data
        const relevantDataProps = ['nodeColor', 'specialNodeColor', 'gradientStart', 'gradientEnd', 
                                   'failureModeNames', 'shouldBlink', 'ttfDays', 'isAttachedToGroup'];
        const dataChanged = relevantDataProps.some(prop => {
          const currentVal = currentNode.data?.[prop];
          const mergedVal = mergedNode.data?.[prop];
          // Handle array comparison for failureModeNames
          if (prop === 'failureModeNames') {
            return JSON.stringify(currentVal) !== JSON.stringify(mergedVal);
          }
          return currentVal !== mergedVal;
        });
        
        if (dataChanged) {
          nodesChanged = true;
          changedNodes.push({ id: mergedNode.id, reason: 'data changed' });
          return;
        }
        
        // Check if extent or parentId changed
        if (currentNode.extent !== mergedNode.extent || currentNode.parentId !== mergedNode.parentId) {
          nodesChanged = true;
          changedNodes.push({ id: mergedNode.id, reason: 'extent/parentId changed' });
          return;
        }
        
        // For child nodes, don't check positionAbsolute as it's calculated by React Flow
        // Only check if position (relative) changed
        if (currentNode.position?.x !== mergedNode.position?.x || 
            currentNode.position?.y !== mergedNode.position?.y) {
          nodesChanged = true;
          changedNodes.push({ id: mergedNode.id, reason: 'position changed' });
          return;
        }
      });
      
      if (!nodesChanged && currentNodes.length === merged.length) {
        return currentNodes; // Return current nodes unchanged
      }
      
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
  
  if (!wasInDeveloperMode) {
    lastProcessedTableDataRef.current = "DEVELOPER_MODE";
    
    setNodes((currentNodes) => {
      if (currentNodes.length > 0) {
        const originalNodeMap = new Map(
          originalFetchedNodesRef.current.map((node) => [node.id, node])
        );
        const result = currentNodes.map((currentNode) => {
          const originalNode = originalNodeMap.get(currentNode.id);
          if (originalNode) {
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
            
            // Only sync if dimensions are missing - don't overwrite existing dimensions
            if (!updatedNode.style?.width || !updatedNode.style?.height) {
              return syncNodeDimensions(updatedNode);
            }
            return updatedNode;
          }
          return currentNode;
        });
        
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
      // Ensure parent-child ordering
      return sortNodesByParentChild(nodesWithLockState);
    });
    
    return { shouldUpdate: true };
  } else {
    // Already in developer mode - don't reset nodes
    // This prevents resize changes from being lost
  }

  return { shouldUpdate: false };
};
 
