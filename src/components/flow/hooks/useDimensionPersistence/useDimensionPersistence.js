import { useEffect, useRef } from 'react';
import { isResizingRef } from '../useNodeResize/useNodeResize';

// --- Pure helper functions (reduce complexity) ---

// Extracts dimension value from node (checks root, data, then style)
function getNodeDimension(node, dimension) {
    return node[dimension] || node.data?.[dimension] || node.style?.[dimension];
}

// Extracts width and height from a node as numbers, returns null if invalid
function extractNodeDimensions(node) {
    const width = Number(getNodeDimension(node, 'width'));
    const height = Number(getNodeDimension(node, 'height'));
    
    if (isNaN(width) || isNaN(height)) {
        return null;
    }
    
    return { width, height };
}

// Gets previous dimensions from tracking ref or original nodes
function getPreviousDimensions(nodeId, prevNodeDimensionsRef, originalFetchedNodesRef) {
    const prevDims = prevNodeDimensionsRef.current.get(nodeId);
    if (prevDims) {
        return prevDims;
    }
    
    const originalNode = originalFetchedNodesRef.current.find(n => n.id === nodeId);
    if (!originalNode) {
        return null;
    }
    
    const dims = extractNodeDimensions(originalNode);
    if (dims) {
        prevNodeDimensionsRef.current.set(nodeId, dims);
        return dims;
    }
    
    return null;
}

// Checks if dimensions have changed between previous and current
function haveDimensionsChanged(prevDims, currentDims) {
    if (!prevDims || !currentDims) {
        return false;
    }
    
    const prevWidth = Number(prevDims.width);
    const prevHeight = Number(prevDims.height);
    
    if (isNaN(prevWidth) || isNaN(prevHeight)) {
        return false;
    }
    
    return prevWidth !== currentDims.width || prevHeight !== currentDims.height;
}

// Processes a single node to check for dimension changes
function processNodeForDimensionChanges(node, prevNodeDimensionsRef, originalFetchedNodesRef) {
    const prevDims = getPreviousDimensions(node.id, prevNodeDimensionsRef, originalFetchedNodesRef);
    const currentDims = extractNodeDimensions(node);
    
    if (!currentDims) {
        return false; // Invalid dimensions, skip
    }
    
    if (!prevDims) {
        // First time seeing this node, store current dimensions
        prevNodeDimensionsRef.current.set(node.id, currentDims);
        return false; // Don't trigger update on first render
    }
    
    return haveDimensionsChanged(prevDims, currentDims);
}

/**
 * Custom hook to track and persist node dimension changes
 * This ensures resize changes are persisted even if handleNodesChange isn't called with resize changes
 * IMPORTANT: This only updates dimensions, preserving all other properties including parentId
 * CRITICAL: Only runs when dimensions change, not on position changes or parent-child relationship changes
 */
export const useDimensionPersistence = ({
    nodes,
    isDeveloperMode,
    originalFetchedNodesRef,
    persistResizedNodeDimensions: persistFunction,
}) => {
    // Track previous node dimensions to detect resize changes
    // This prevents the useEffect from running on every node change (like position updates during drag)
    const prevNodeDimensionsRef = useRef(new Map());
    // Track the last known resize state to detect when resize ends
    const lastResizingStateRef = useRef(false);
    
    useEffect(() => {
        if (!isDeveloperMode) {
            return;
        }
        
        // CRITICAL: Skip if originalFetchedNodesRef is empty
        if (originalFetchedNodesRef.current.length === 0) {
            return;
        }
        
        const wasResizing = lastResizingStateRef.current;
        const isResizing = isResizingRef.current;
        lastResizingStateRef.current = isResizing;
        
        // If resizing, don't update tracking - wait for resize to end
        // This ensures we can detect dimension changes when resize ends
        if (isResizing) {
            return;
        }
        
        // Check if any node dimensions have actually changed (not just position or parentId changes)
        const hasDimensionChanges = nodes.some(node => 
            processNodeForDimensionChanges(node, prevNodeDimensionsRef, originalFetchedNodesRef)
        );
        
        // Only update if dimensions actually changed (not just position or parent-child relationship changes)
        if (!hasDimensionChanges) {
            // Update tracking even if no changes detected, to keep baseline current
            // This handles cases where nodes are updated for other reasons (position, parentId, etc.)
            // BUT: Don't update if resize just ended - we want to preserve the baseline for comparison
            // CRITICAL: Always update tracking to preserve manually resized dimensions
            // This ensures dimensions are preserved when clicking outside or on another node
            nodes.forEach(node => {
                const dims = extractNodeDimensions(node);
                if (dims) {
                    prevNodeDimensionsRef.current.set(node.id, dims);
                }
            });
            return;
        }
        
        // Small delay to ensure resize flag is cleared and state has settled
        // This prevents interference with parent-child drag operations
        const timeoutId = setTimeout(() => {
            // Double-check that resize is not active (in case it was set during the timeout)
            if (!isResizingRef.current) {
                // Update original fetched nodes with current node dimensions
                // persistResizedNodeDimensions only updates dimensions and preserves all other properties
                // including parentId, position, and all data properties
                persistFunction(nodes, originalFetchedNodesRef);
                // Update tracking after persisting changes
                nodes.forEach(node => {
                    const dims = extractNodeDimensions(node);
                    if (dims) {
                        prevNodeDimensionsRef.current.set(node.id, dims);
                    }
                });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [nodes, isDeveloperMode, originalFetchedNodesRef, persistFunction]);
};
 