import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

// Syncs dimensions from various sources to style for backward compatibility with existing stored nodes
// Handles dimensions stored in: root level (width/height), style, data, or measured
// NodeResizer REQUIRES dimensions in style to work, so we must ensure all nodes have them
export const syncNodeDimensions = (node) => {
  // Priority 1: If node already has style dimensions, use them
  if (node.style?.width && node.style?.height) {
    // Still preserve position and parent-child properties
    return {
      ...node,
      position: node.position,
      positionAbsolute: node.positionAbsolute,
      parentId: node.parentId,
      extent: node.extent
    };
  }
  
  // Priority 2: Check root level width/height (React Flow format)
  const rootWidth = node.width;
  const rootHeight = node.height;
  if (rootWidth && rootHeight) {
    return {
      ...node,
      width: rootWidth,
      height: rootHeight,
      // CRITICAL: Explicitly preserve position and parent-child properties
      position: node.position,
      positionAbsolute: node.positionAbsolute,
      parentId: node.parentId,
      extent: node.extent,
      style: {
        ...node.style,
        width: rootWidth,
        height: rootHeight,
      },
      data: {
        ...node.data,
        width: rootWidth,
        height: rootHeight,
      },
    };
  }
  
  // Priority 3: Check data dimensions
  if (node.data?.width && node.data?.height) {
    return {
      ...node,
      width: node.data.width,
      height: node.data.height,
      // CRITICAL: Explicitly preserve position and parent-child properties
      position: node.position,
      positionAbsolute: node.positionAbsolute,
      parentId: node.parentId,
      extent: node.extent,
      style: {
        ...node.style,
        width: node.data.width,
        height: node.data.height,
      },
    };
  }
  
  // Priority 4: Use consistent default dimensions (250x250) for nodes without any dimensions
  // CRITICAL: Don't use measured dimensions as they can vary (45x45, etc.)
  // Use a consistent default size so all nodes without dimensions get the same size
  const hasAnyDimensions = node.width || node.height || node.data?.width || node.data?.height;
  if (!hasAnyDimensions) {
    // Use consistent default dimensions instead of measured dimensions
    // This ensures all nodes without dimensions get the same size (250x250)
    const defaultWidth = 250;
    const defaultHeight = 250;
    
    return {
      ...node,
      width: defaultWidth,
      height: defaultHeight,
      // CRITICAL: Explicitly preserve position and parent-child properties
      position: node.position,
      positionAbsolute: node.positionAbsolute,
      parentId: node.parentId,
      extent: node.extent,
      style: {
        ...node.style,
        width: defaultWidth,
        height: defaultHeight,
      },
      data: {
        ...node.data,
        width: defaultWidth,
        height: defaultHeight,
      },
    };
  }
  
  // If no dimensions found anywhere, return node as-is
  // NodeResizer might not work, but at least we don't break the node
  // CRITICAL: Still preserve position and parent-child properties
  return {
    ...node,
    position: node.position,
    positionAbsolute: node.positionAbsolute,
    parentId: node.parentId,
    extent: node.extent
  };
};

//Applies resize changes to nodes
// Works for both: nodes with children (parents) and nodes without children (regular nodes)
// Also works for child nodes (nodes with a parentId)
export const applyResizeChanges = (nodes, changesWithSnapping) => {
  return nodes.map((node) => {
    const resizeChange = changesWithSnapping.find(
      (change) => change.type === "resize" && change.id === node.id
    );
    if (!resizeChange) return node;
    
    // Extract dimensions from resize change
    // React Flow provides dimensions in resizeChange.dimensions
    const newWidth = resizeChange.dimensions?.width;
    const newHeight = resizeChange.dimensions?.height;
    
    // If dimensions are not in the change, check if they're already in the node (from applyNodeChanges)
    // This handles cases where applyNodeChanges already updated the node
    const finalWidth = newWidth ?? node.width ?? node.style?.width;
    const finalHeight = newHeight ?? node.height ?? node.style?.height;
    
    // Only update if we have valid dimensions
    if (!finalWidth || !finalHeight) {
      return node;
    }
    
    // For all nodes (with or without children, with or without parent):
    // - Update dimensions in root level, style, and data (for full compatibility)
    // - Preserve parentId (undefined for regular/parent nodes, set for child nodes)
    // - Preserve position (React Flow handles child positioning automatically when parentId is set)
    const updatedNode = {
      ...node,
      // Update root level dimensions (React Flow format)
      width: finalWidth,
      height: finalHeight,
      // Preserve parentId: undefined for regular/parent nodes, actual ID for child nodes
      parentId: node.parentId,
      // Preserve position: React Flow maintains child positions relative to parent automatically
      position: node.position,
      style: {
        ...node.style,
        width: finalWidth,
        height: finalHeight,
      },
      data: {
        ...node.data,
        width: finalWidth,
        height: finalHeight,
      },
    };
    
    return updatedNode;
  });
};

// Global ref to track if any node is being resized
// This prevents handleTableDataChange from interfering during resize
export const isResizingRef = { current: false };

// Global callback to persist resize changes to originalFetchedNodesRef
// Set by Flow.jsx to persist dimension changes after resize ends
export const persistResizeChangesRef = { current: null };

// Custom hook that provides resize handler for nodes
export const useNodeResize = (id) => {
  const { setNodes, getNodes } = useReactFlow();

  // Handle resize during dragging (real-time updates)
  // React Flow's NodeResizer doesn't automatically update state when onResize is provided
  // We need to update state ourselves to ensure dimensions are applied
  const onResize = useCallback(
    (_, params) => {
      // Set resize flag to prevent handleTableDataChange from interfering
      isResizingRef.current = true;
      
      // Update node dimensions in real-time
      // React Flow's NodeResizer provides params but doesn't update state automatically
      setNodes((nds) => {
        return nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              width: params.width,
              height: params.height,
              parentId: node.parentId, // Preserve parent-child relationships
              position: node.position,
              style: {
                ...node.style,
                width: params.width,
                height: params.height,
              },
              data: {
                ...node.data,
                width: params.width,
                height: params.height,
              },
            };
          }
          return node;
        });
      });
    },
    [id, setNodes]
  );

  // Handle resize end (final update)
  // React Flow's NodeResizer doesn't automatically update state when onResizeEnd is provided
  // We need to update state ourselves and then persist
  const onResizeEnd = useCallback(
    (_, params) => {
      // Update node with final dimensions
      setNodes((nds) => {
        const updatedNodes = nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              width: params.width,
              height: params.height,
              parentId: node.parentId, // Preserve parent-child relationships
              position: node.position,
              style: {
                ...node.style,
                width: params.width,
                height: params.height,
              },
              data: {
                ...node.data,
                width: params.width,
                height: params.height,
              },
            };
          }
          return node;
        });
        
        // Persist changes after state update
        // Use the updated node from the state update, not getNodes() which might be stale
        setTimeout(() => {
          if (persistResizeChangesRef.current) {
            const resizedNode = updatedNodes.find(n => n.id === id);
            if (resizedNode) {
              // Only pass the resized node wrapped in an array
              persistResizeChangesRef.current([resizedNode]);
            }
          }
        }, 100); // Small delay to ensure state update is applied
        
        return updatedNodes;
      });
      
      // Clear resize flag after a delay to allow state updates to complete
      setTimeout(() => {
        isResizingRef.current = false;
      }, 200);
    },
    [id, setNodes]
  );

  return { onResize, onResizeEnd };
};