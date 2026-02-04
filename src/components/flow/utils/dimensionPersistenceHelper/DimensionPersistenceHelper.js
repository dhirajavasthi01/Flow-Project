// Helper function to update originalFetchedNodesRef when nodes are resized
// Works for all node types: regular nodes, parent nodes (with children), and child nodes
// This function receives only the resized node(s) from onResizeEnd
// This prevents false positives when comparing unchanged nodes
// Only update nodes that have been resized (check if dimensions changed)
// This ensures parent nodes can be resized without affecting their children
// and child nodes can be resized without affecting their parent
export const persistResizedNodeDimensions = (finalNodes, originalFetchedNodesRef) => {
    const resizedNodeIds = new Set();
    finalNodes.forEach(node => {
        const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
        if (originalNode) {
            // Check dimensions from all possible locations: root, style, data
            // Convert to numbers for accurate comparison (handles string vs number mismatches)
            // CRITICAL: Get dimensions from root first (most reliable), then style, then data
            const originalWidth = Number(originalNode.width || originalNode.style?.width || originalNode.data?.width);
            const originalHeight = Number(originalNode.height || originalNode.style?.height || originalNode.data?.height);
            const newWidth = Number(node.width || node.style?.width || node.data?.width);
            const newHeight = Number(node.height || node.style?.height || node.data?.height);
            
            // Only consider it a resize if dimensions actually changed (not just type conversion)
            if (!isNaN(originalWidth) && !isNaN(originalHeight) && !isNaN(newWidth) && !isNaN(newHeight)) {
                if (originalWidth !== newWidth || originalHeight !== newHeight) {
                    resizedNodeIds.add(node.id);
                }
            }
        } else {
            // Node doesn't exist in originalFetchedNodesRef, so it's a new node - treat as resized
            const newWidth = Number(node.width || node.style?.width || node.data?.width);
            const newHeight = Number(node.height || node.style?.height || node.data?.height);
            if (!isNaN(newWidth) && !isNaN(newHeight)) {
                resizedNodeIds.add(node.id);
            }
        }
    });
    
    // CRITICAL: If originalFetchedNodesRef is empty, add all nodes to it
    // This handles the case where nodes are created but originalFetchedNodesRef wasn't populated
    if (originalFetchedNodesRef.current.length === 0) {
        originalFetchedNodesRef.current = finalNodes.map(node => {
            // CRITICAL: Get dimensions from root first (most reliable), then style, then data
            const nodeWidth = node.width || node.style?.width || node.data?.width;
            const nodeHeight = node.height || node.style?.height || node.data?.height;
            return {
                ...node,
                width: nodeWidth,
                height: nodeHeight,
                style: {
                    ...node.style,
                    width: nodeWidth,
                    height: nodeHeight,
                },
                data: {
                    ...node.data,
                    width: nodeWidth,
                    height: nodeHeight,
                },
            };
        });
        return;
    }
    
    if (resizedNodeIds.size === 0) {
        // Even if no nodes were resized, check if any new nodes need to be added
        finalNodes.forEach(node => {
            if (!originalFetchedNodesRef.current.find(n => n.id === node.id)) {
                const nodeWidth = node.width || node.data?.width || node.style?.width;
                const nodeHeight = node.height || node.data?.height || node.style?.height;
                originalFetchedNodesRef.current.push({
                    ...node,
                    width: nodeWidth,
                    height: nodeHeight,
                    style: {
                        ...node.style,
                        width: nodeWidth,
                        height: nodeHeight,
                    },
                    data: {
                        ...node.data,
                        width: nodeWidth,
                        height: nodeHeight,
                    },
                });
            }
        });
        return;
    }
    
    // Only update the resized nodes, preserve all others exactly as they were
    originalFetchedNodesRef.current = originalFetchedNodesRef.current.map(originalNode => {
        const updatedNode = finalNodes.find(n => n.id === originalNode.id);
        if (updatedNode && resizedNodeIds.has(originalNode.id)) {
            // Only update dimensions for resized nodes, preserve everything else
            // Update dimensions in all locations: root, style, and data
            // CRITICAL: Get dimensions from root first (most reliable), then style, then data
            // This ensures we use the actual resized dimensions, not stale data dimensions
            const updatedWidth = updatedNode.width || updatedNode.style?.width || updatedNode.data?.width;
            const updatedHeight = updatedNode.height || updatedNode.style?.height || updatedNode.data?.height;
            
            const updated = {
                ...originalNode,
                // Update root level dimensions
                width: updatedWidth,
                height: updatedHeight,
                // CRITICAL: Preserve parent-child relationships
                // parentId must be preserved from originalNode, not from updatedNode
                // because updatedNode might have incorrect parentId during resize operations
                parentId: originalNode.parentId,
                // Preserve position and positionAbsolute (React Flow maintains these for parent-child)
                position: originalNode.position,
                positionAbsolute: originalNode.positionAbsolute,
                // CRITICAL: Update style dimensions - don't spread updatedNode.style first as it may have stale dimensions
                // Set width/height explicitly to ensure they match the root dimensions
                style: {
                    ...originalNode.style,
                    width: updatedWidth,
                    height: updatedHeight,
                    // Preserve other style properties from updatedNode (like backgroundColor, etc.)
                    ...Object.fromEntries(
                        Object.entries(updatedNode.style || {}).filter(([key]) => key !== 'width' && key !== 'height')
                    ),
                },
                data: {
                    ...originalNode.data,
                    width: updatedWidth,
                    height: updatedHeight,
                },
            };
            
            return updated;
        }
        // For non-resized nodes, return the original unchanged
        return originalNode;
    });
    
    // Add any new nodes that weren't in the original
    // CRITICAL: This ensures new nodes (dragged from node list) are added to originalFetchedNodesRef
    // so their dimensions can be persisted
    finalNodes.forEach(node => {
        if (!originalFetchedNodesRef.current.find(n => n.id === node.id)) {
            // CRITICAL: Sync dimensions to all locations before adding
            const nodeWidth = node.width || node.data?.width || node.style?.width;
            const nodeHeight = node.height || node.data?.height || node.style?.height;
            const nodeToAdd = {
                ...node,
                width: nodeWidth,
                height: nodeHeight,
                style: {
                    ...node.style,
                    width: nodeWidth,
                    height: nodeHeight,
                },
                data: {
                    ...node.data,
                    width: nodeWidth,
                    height: nodeHeight,
                },
            };
            originalFetchedNodesRef.current.push(nodeToAdd);
        }
    });
};
 