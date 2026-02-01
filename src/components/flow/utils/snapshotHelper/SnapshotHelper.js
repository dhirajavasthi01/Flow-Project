// Creates and adds a snapshot to history
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

// Undoes the last action by restoring the previous state
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

//Handles keyboard shortcuts for undo, copy, paste, and delete operations
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
// Checks if snapping should be applied to a change
export const shouldApplySnapping = (change, dragEndNodeId) => {
  if (change.type !== "position" || !change.position) return false;
  const isDragging = change.dragging === true;
  const isDragEnd = change.dragging === false && change.id === dragEndNodeId;
  return isDragging || isDragEnd;
};

// Validates if the snap distance is within acceptable range
export const isValidSnapDistance = (snappedPosition, originalPosition) => {
  const maxSnapDistance = 5;
  const xDiff = Math.abs(snappedPosition.x - originalPosition.x);
  const yDiff = Math.abs(snappedPosition.y - originalPosition.y);
  if (xDiff > maxSnapDistance || yDiff > maxSnapDistance) return false;
  return xDiff > 0.1 || yDiff > 0.1;
};

// Applies snapping to a single change
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

// Applies snapping to multiple changes
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
 