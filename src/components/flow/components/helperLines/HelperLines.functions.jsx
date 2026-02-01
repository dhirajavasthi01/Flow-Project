import { CompareValuesWithSymbol } from "../../../../utills/nodeNameUtils/nodeNameUtils";

const DOT_NODE_SIZE = 12;

export const calculateCanvasBounds = ({ viewport, width, height }) => {
  const canvasWidth = width || 1000;
  const canvasHeight = height || 1000;
  const visibleLeft = -viewport.x / viewport.zoom;
  const visibleRight = (canvasWidth - viewport.x) / viewport.zoom;
  const visibleTop = -viewport.y / viewport.zoom;
  const visibleBottom = (canvasHeight - viewport.y) / viewport.zoom;
 
  return {
    left: Math.min(visibleLeft - 5000, -50000),
    right: Math.max(visibleRight + 5000, 50000),
    top: Math.min(visibleTop - 5000, -50000),
    bottom: Math.max(visibleBottom + 5000, 50000),
  };
}

//  Helper function to get node dimensions
export const getNodeDimensions = ({ node, nodeFromState, isDot }) => {
  if (isDot) return { width: DOT_NODE_SIZE, height: DOT_NODE_SIZE };
 
  const width = CompareValuesWithSymbol('||', node?.measured?.width, node?.width, nodeFromState?.width, nodeFromState?.data?.width, 0)
  const height  = CompareValuesWithSymbol('||', node?.measured?.height, node?.height, nodeFromState?.height, nodeFromState?.data?.height, 0)
  return { width, height };
}

// Calculate dot node center coordinates
export const calculateDotNodeCenter = ({ draggingPosition }) => {
  return {
    centerX: draggingPosition.x + DOT_NODE_SIZE / 2,
    centerY: draggingPosition.y + DOT_NODE_SIZE / 2,
  };
}

// Add dot node center coordinates to alignment maps
export const addDotNodeCoords = ({ nodeId, centerX, centerY, allHorizontalCoords, allVerticalCoords }) => {
  if (!allVerticalCoords.has(centerX)) allVerticalCoords.set(centerX, new Set());
  if (!allHorizontalCoords.has(centerY)) allHorizontalCoords.set(centerY, new Set());
 
  allVerticalCoords.get(centerX).add(nodeId);
  allHorizontalCoords.get(centerY).add(nodeId);
}

// Helper function to check if a node is a dot node
export const isDotNode = ({ node, nodeFromState = null }) => {
  const type = String((node?.type || nodeFromState?.type || '')).toLowerCase();
  const nodeType = String((node?.nodeType || nodeFromState?.nodeType || '')).toLowerCase();
  return type.includes('dotnode') || nodeType.includes('dot-node');
}

//  Add dot node center alignments if dragging a dot node
export const addDotNodeCenterAlignments = ({ dotNodeCenterX, dotNodeCenterY, horizontalAlignments, verticalAlignments }) => {
  if (dotNodeCenterY !== null) {
    horizontalAlignments.push({ y: dotNodeCenterY });
  }
  if (dotNodeCenterX !== null) {
    verticalAlignments.push({ x: dotNodeCenterX });
  }
}