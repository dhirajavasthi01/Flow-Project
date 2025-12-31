import { useCallback } from 'react';
import { useStore } from '@xyflow/react';
const SNAP_THRESHOLD = 5; // pixels in flow coordinates
const DOT_NODE_SIZE = 12; // Dot nodes are 12px x 12px
/**
 * Check if a node is a dot node
 */
function isDotNode(node) {
  const type = String(node?.type || '').toLowerCase();
  const nodeType = String(node?.nodeType || '').toLowerCase();
  return type.includes('dotnode') || nodeType.includes('dot-node');
}
/**
 * Get node dimensions
 */
function getNodeDimensions({ node, isDot }) {
  if (isDot) return { width: DOT_NODE_SIZE, height: DOT_NODE_SIZE };
  return {
    width: node?.measured?.width || node?.width || node?.data?.width || 0,
    height: node?.measured?.height || node?.height || node?.data?.height || 0,
  };
}
/**
 * Get node position from various sources
 */
function getNodePosition(node) {
  if (node?.internals?.positionAbsolute) {
    return node.internals.positionAbsolute;
  }
  if (node?.position) {
    return { x: node.position.x || 0, y: node.position.y || 0 };
  }
  return null;
}
/**
 * Calculate alignment points for a node
 */
function getAlignmentPoints({ position, width, height }) {
  return {
    left: position.x,
    right: position.x + width,
    centerX: position.x + width / 2,
    top: position.y,
    bottom: position.y + height,
    centerY: position.y + height / 2,
  };
}
/**
 * Apply snapping for center-to-center alignment (used for dot nodes)
 */
function snapCenterToCenter({
  draggingPoints,
  otherPoints,
  nodeWidth,
  nodeHeight,
  snappedX,
  snappedY,
  minXDiff,
  minYDiff,
}) {
  const centerXDiff = Math.abs(draggingPoints.centerX - otherPoints.centerX);
  const centerYDiff = Math.abs(draggingPoints.centerY - otherPoints.centerY);
  let newSnappedX = snappedX;
  let newSnappedY = snappedY;
  let newMinXDiff = minXDiff;
  let newMinYDiff = minYDiff;
  if (centerXDiff < SNAP_THRESHOLD && centerXDiff < minXDiff) {
    newSnappedX = otherPoints.centerX - nodeWidth / 2;
    newMinXDiff = centerXDiff;
  }
  if (centerYDiff < SNAP_THRESHOLD && centerYDiff < minYDiff) {
    newSnappedY = otherPoints.centerY - nodeHeight / 2;
    newMinYDiff = centerYDiff;
  }
  return { snappedX: newSnappedX, snappedY: newSnappedY, minXDiff: newMinXDiff, minYDiff: newMinYDiff };
}
/**
 * Apply snapping for regular node alignments
 */
function snapRegularNode({
  draggingPoints,
  otherPoints,
  nodeWidth,
  nodeHeight,
  snappedX,
  snappedY,
  minXDiff,
  minYDiff,
}) {
  const horizontalAlignments = [
    { dragging: draggingPoints.top, other: otherPoints.top, snapY: otherPoints.top },
    { dragging: draggingPoints.centerY, other: otherPoints.centerY, snapY: otherPoints.centerY - nodeHeight / 2 },
    { dragging: draggingPoints.bottom, other: otherPoints.bottom, snapY: otherPoints.bottom - nodeHeight },
  ];
  const verticalAlignments = [
    { dragging: draggingPoints.left, other: otherPoints.left, snapX: otherPoints.left },
    { dragging: draggingPoints.centerX, other: otherPoints.centerX, snapX: otherPoints.centerX - nodeWidth / 2 },
    { dragging: draggingPoints.right, other: otherPoints.right, snapX: otherPoints.right - nodeWidth },
  ];
  let newSnappedX = snappedX;
  let newSnappedY = snappedY;
  let newMinXDiff = minXDiff;
  let newMinYDiff = minYDiff;
  // Check horizontal alignments
  for (const alignment of horizontalAlignments) {
    const diff = Math.abs(alignment.dragging - alignment.other);
    if (diff < SNAP_THRESHOLD && diff < newMinYDiff) {
      newSnappedY = alignment.snapY;
      newMinYDiff = diff;
    }
  }
  // Check vertical alignments
  for (const alignment of verticalAlignments) {
    const diff = Math.abs(alignment.dragging - alignment.other);
    if (diff < SNAP_THRESHOLD && diff < newMinXDiff) {
      newSnappedX = alignment.snapX;
      newMinXDiff = diff;
    }
  }
  return { snappedX: newSnappedX, snappedY: newSnappedY, minXDiff: newMinXDiff, minYDiff: newMinYDiff };
}
/**
 * Process a single node for snapping alignment
 */
function processNodeForSnapping({
  node,
  otherNodeId,
  draggingPoints,
  nodeWidth,
  nodeHeight,
  isDraggingDotNode,
  snappedX,
  snappedY,
  minXDiff,
  minYDiff,
}) {
  const nodePosition = getNodePosition(node);
  if (!nodePosition) {
    return { snappedX, snappedY, minXDiff, minYDiff };
  }
  const isOtherDotNode = isDotNode(node);
  const { width: otherWidth, height: otherHeight } = getNodeDimensions({ node, isDot: isOtherDotNode });
  const otherPoints = getAlignmentPoints({ position: nodePosition, width: otherWidth, height: otherHeight });
  // Handle dot node snapping (center-to-center only)
  if (isDraggingDotNode || isOtherDotNode) {
    return snapCenterToCenter({
      draggingPoints,
      otherPoints,
      nodeWidth,
      nodeHeight,
      snappedX,
      snappedY,
      minXDiff,
      minYDiff,
    });
  }
  // Regular node snapping
  return snapRegularNode({
    draggingPoints,
    otherPoints,
    nodeWidth,
    nodeHeight,
    snappedX,
    snappedY,
    minXDiff,
    minYDiff,
  });
}
/**
 * Hook that provides helper lines functionality including snapping
 * @returns {object} Object with snapNodePosition function
 */
export function useHelperLines() {
  const nodeLookup = useStore((state) => state.nodeLookup);
  const snapNodePosition = useCallback(
    (nodeId, position) => {
      const draggingNode = nodeLookup.get(nodeId);
      if (!draggingNode) return position;
      const isDraggingDotNode = isDotNode(draggingNode);
      const { width: nodeWidth, height: nodeHeight } = getNodeDimensions({ node: draggingNode, isDot: isDraggingDotNode });
      const draggingPoints = getAlignmentPoints({ position, width: nodeWidth, height: nodeHeight });
      let snappedX = position.x;
      let snappedY = position.y;
      let minXDiff = Infinity;
      let minYDiff = Infinity;
      // Check alignment with all other nodes
      for (const [otherNodeId, node] of nodeLookup.entries()) {
        if (otherNodeId === nodeId) continue;
        const result = processNodeForSnapping({
          node,
          otherNodeId,
          draggingPoints,
          nodeWidth,
          nodeHeight,
          isDraggingDotNode,
          snappedX,
          snappedY,
          minXDiff,
          minYDiff,
        });
        snappedX = result.snappedX;
        snappedY = result.snappedY;
        minXDiff = result.minXDiff;
        minYDiff = result.minYDiff;
      }
      return { x: snappedX, y: snappedY };
    },
    [nodeLookup]
  );
  return { snapNodePosition };
}
 