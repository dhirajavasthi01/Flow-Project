/**
 * Creates and adds a snapshot to history
 * @param {Array} nodes - Current nodes array
 * @param {Array} edges - Current edges array
 * @param {Object} historyRef - Ref object containing the history array
 * @param {Object} isUndoingRef - Ref object indicating if undo is in progress
 */
export const takeSnapshot = (nodes, edges, historyRef, isUndoingRef) => {
  if (isUndoingRef.current) return;
  const snapshot = {
    nodes: nodes.map((n) => ({
      ...n,
      selected: false,
      data: { ...n.data },
      style: { ...n.style },
    })),
    edges: edges.map((e) => ({
      ...e,
      selected: false,
      style: { ...e.style },
    })),
  };
  historyRef.current = [...historyRef.current.slice(-49), snapshot];
};

/**
 * Undoes the last action by restoring the previous state
 * @param {Object} historyRef - Ref object containing the history array
 * @param {Object} isUndoingRef - Ref object indicating if undo is in progress
 * @param {Function} setNodes - Function to update nodes state
 * @param {Function} setEdges - Function to update edges state
 * @param {Function} setSelectedNodeId - Function to clear selected node
 * @param {Function} setSelectedEdgeId - Function to clear selected edge
 * @param {Function} setConfig - Function to clear config
 */
export const undo = (
  historyRef,
  isUndoingRef,
  setNodes,
  setEdges,
  setSelectedNodeId,
  setSelectedEdgeId,
  setConfig
) => {
  if (historyRef.current.length === 0) return;
  isUndoingRef.current = true;
  const previousState = historyRef.current.pop();
  setNodes(previousState.nodes);
  setEdges(previousState.edges);
  setSelectedNodeId(null);
  setSelectedEdgeId(null);
  setConfig(null);
  setTimeout(() => {
    isUndoingRef.current = false;
  }, 100);
};

/**
 * Handles keyboard shortcuts for undo, copy, paste, and delete operations
 * @param {Event} e - Keyboard event
 * @param {Function} undo - Undo function
 * @param {Function} takeSnapshot - Take snapshot function
 * @param {Object} nodeToCopy - Node to copy
 * @param {Function} setNewNode - Function to set new node
 * @param {Function} setNodeToCopy - Function to set node to copy
 * @param {Object} config - Current config
 * @param {string} selectedNodeId - Selected node ID
 * @param {Function} setShouldDelete - Function to trigger delete
 */
export const handleKeyPress = (
  e,
  undo,
  takeSnapshot,
  nodeToCopy,
  setNewNode,
  setNodeToCopy,
  config,
  selectedNodeId,
  setShouldDelete
) => {
  if (e.ctrlKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    e.stopPropagation();
    undo();
    return;
  }
  if (e.ctrlKey && e.key === "v" && nodeToCopy) {
    setNewNode(nodeToCopy);
    setNodeToCopy(null);
  }
  if (e.ctrlKey && e.key === "c" && config && selectedNodeId) {
    setNodeToCopy(config);
  }
  if (e.key === "Delete" && config) {
    takeSnapshot();
    setShouldDelete(true);
  }
};

// ========== Snapping Helper Functions ==========

/**
 * Checks if snapping should be applied to a change
 * @param {Object} change - The change object
 * @param {string} dragEndNodeId - ID of the node that ended dragging
 * @returns {boolean} Whether snapping should be applied
 */
export const shouldApplySnapping = (change, dragEndNodeId) => {
  if (change.type !== "position" || !change.position) return false;
  const isDragging = change.dragging === true;
  const isDragEnd = change.dragging === false && change.id === dragEndNodeId;
  return isDragging || isDragEnd;
};

/**
 * Validates if the snap distance is within acceptable range
 * @param {Object} snappedPosition - The snapped position
 * @param {Object} originalPosition - The original position
 * @returns {boolean} Whether the snap distance is valid
 */
export const isValidSnapDistance = (snappedPosition, originalPosition) => {
  const maxSnapDistance = 5;
  const xDiff = Math.abs(snappedPosition.x - originalPosition.x);
  const yDiff = Math.abs(snappedPosition.y - originalPosition.y);
  if (xDiff > maxSnapDistance || yDiff > maxSnapDistance) return false;
  return xDiff > 0.1 || yDiff > 0.1;
};

/**
 * Applies snapping to a single change
 * @param {Object} change - The change object
 * @param {string} dragEndNodeId - ID of the node that ended dragging
 * @param {Function} checkIsDotNode - Function to check if a node is a dot node
 * @param {Function} snapNodePosition - Function to snap node position
 * @returns {Object} The change object with snapped position if applicable
 */
export const applySnappingToChange = (
  change,
  dragEndNodeId,
  checkIsDotNode,
  snapNodePosition
) => {
  if (!shouldApplySnapping(change, dragEndNodeId)) {
    return change;
  }
  if (checkIsDotNode(change.id)) {
    return change;
  }
  const snappedPosition = snapNodePosition(change.id, change.position);
  if (!isValidSnapDistance(snappedPosition, change.position)) {
    return change;
  }
  return {
    ...change,
    position: snappedPosition,
  };
};

/**
 * Applies snapping to multiple changes
 * @param {Array} changes - Array of change objects
 * @param {string} dragEndNodeId - ID of the node that ended dragging
 * @param {Function} checkIsDotNode - Function to check if a node is a dot node
 * @param {Function} snapNodePosition - Function to snap node position
 * @returns {Array} Array of changes with snapping applied
 */
export const applySnappingToChanges = (
  changes,
  dragEndNodeId,
  checkIsDotNode,
  snapNodePosition
) => {
  return changes.map((change) =>
    applySnappingToChange(change, dragEndNodeId, checkIsDotNode, snapNodePosition)
  );
};
