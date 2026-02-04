import { useEffect, useRef } from 'react';
import { isResizingRef } from '../useNodeResize/useNodeResize';

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
        let hasDimensionChanges = false;
        
        nodes.forEach(node => {
            let prevDims = prevNodeDimensionsRef.current.get(node.id);
            
            // If we don't have previous dimensions, try to get them from originalFetchedNodesRef
            // This ensures we compare against the original stored dimensions, not the current dimensions
            if (!prevDims) {
                const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
                if (originalNode) {
                    const origWidth = Number(originalNode.width || originalNode.data?.width || originalNode.style?.width);
                    const origHeight = Number(originalNode.height || originalNode.data?.height || originalNode.style?.height);
                    if (!isNaN(origWidth) && !isNaN(origHeight)) {
                        prevDims = { width: origWidth, height: origHeight };
                        prevNodeDimensionsRef.current.set(node.id, prevDims);
                    }
                }
            }
            
            // Convert to numbers for accurate comparison (handles string vs number mismatches)
            const currentWidth = Number(node.width || node.data?.width || node.style?.width);
            const currentHeight = Number(node.height || node.data?.height || node.style?.height);
            
            // Skip if dimensions are invalid
            if (isNaN(currentWidth) || isNaN(currentHeight)) {
                return;
            }
            
            if (!prevDims) {
                // First time seeing this node and no original found, store current dimensions
                prevNodeDimensionsRef.current.set(node.id, { width: currentWidth, height: currentHeight });
                return; // Don't trigger update on first render
            }
            
            // Check if dimensions changed (ignore position, parentId, or other property changes)
            // Compare as numbers to handle type mismatches
            const prevWidth = Number(prevDims.width);
            const prevHeight = Number(prevDims.height);
            
            if (!isNaN(prevWidth) && !isNaN(prevHeight)) {
                if (prevWidth !== currentWidth || prevHeight !== currentHeight) {
                    hasDimensionChanges = true;
                }
            }
        });
        
        // Only update if dimensions actually changed (not just position or parent-child relationship changes)
        if (!hasDimensionChanges) {
            // Update tracking even if no changes detected, to keep baseline current
            // This handles cases where nodes are updated for other reasons (position, parentId, etc.)
            // BUT: Don't update if resize just ended - we want to preserve the baseline for comparison
            // CRITICAL: Always update tracking to preserve manually resized dimensions
            // This ensures dimensions are preserved when clicking outside or on another node
            nodes.forEach(node => {
                const currentWidth = Number(node.width || node.data?.width || node.style?.width);
                const currentHeight = Number(node.height || node.data?.height || node.style?.height);
                if (!isNaN(currentWidth) && !isNaN(currentHeight)) {
                    prevNodeDimensionsRef.current.set(node.id, { width: currentWidth, height: currentHeight });
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
                    const currentWidth = Number(node.width || node.data?.width || node.style?.width);
                    const currentHeight = Number(node.height || node.data?.height || node.style?.height);
                    if (!isNaN(currentWidth) && !isNaN(currentHeight)) {
                        prevNodeDimensionsRef.current.set(node.id, { width: currentWidth, height: currentHeight });
                    }
                });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [nodes, isDeveloperMode, originalFetchedNodesRef, persistFunction]);
};
 