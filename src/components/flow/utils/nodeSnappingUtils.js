/**
 * Utility functions for node snapping
 */

export function detectDragEndNodeId(changes) {
  for (const change of changes) {
    if (change.type === 'position' && change.dragging === false) {
      return change.id;
    }
  }
  return null;
}

export function checkIsDotNode(nodeLookup, nodeId) {
  const node = nodeLookup.get(nodeId);
  return node?.type?.includes('dotNode') || node?.nodeType?.includes('dot-node');
}

export function shouldApplySnapping(change, dragEndNodeId) {
  if (change.type !== 'position' || !change.position) return false;
  const isDragging = change.dragging === true;
  const isDragEnd = change.dragging === false && change.id === dragEndNodeId;
  return isDragging || isDragEnd;
}

export function isValidSnapDistance(snappedPosition, originalPosition) {
  const maxSnapDistance = 5;
  const xDiff = Math.abs(snappedPosition.x - originalPosition.x);
  const yDiff = Math.abs(snappedPosition.y - originalPosition.y);
  
  if (xDiff > maxSnapDistance || yDiff > maxSnapDistance) return false;
  return xDiff > 0.1 || yDiff > 0.1;
}

export function applySnappingToChange(change, dragEndNodeId, nodeLookup, snapNodePosition) {
  if (!shouldApplySnapping(change, dragEndNodeId)) {
    return change;
  }

  if (checkIsDotNode(nodeLookup, change.id)) {
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
}

export function applySnappingToChanges(changes, dragEndNodeId, nodeLookup, snapNodePosition) {
  return changes.map(change => applySnappingToChange(change, dragEndNodeId, nodeLookup, snapNodePosition));
}
