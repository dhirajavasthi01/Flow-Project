import { useMemo } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';

const DOT_NODE_SIZE = 12; // Dot nodes are 12px x 12px

/**
 * Helper function to check if a node is a dot node
 */
function isDotNode({ node, nodeFromState = null }) {
  const type = String((node?.type || nodeFromState?.type || '')).toLowerCase();
  const nodeType = String((node?.nodeType || nodeFromState?.nodeType || '')).toLowerCase();
  return type.includes('dotnode') || nodeType.includes('dot-node');
}

/**
 * Helper function to get node position
 */
function getNodePosition({ node, nodeFromState, isDraggingNode }) {
  if (isDraggingNode && node?.internals?.positionAbsolute) {
    return node.internals.positionAbsolute;
  }
  if (nodeFromState?.position) {
    return { x: nodeFromState.position.x || 0, y: nodeFromState.position.y || 0 };
  }
  if (node?.internals?.positionAbsolute) {
    return node.internals.positionAbsolute;
  }
  if (node?.position) {
    return { x: node.position.x || 0, y: node.position.y || 0 };
  }
  return null;
}

/**
 * Helper function to get node dimensions
 */
function getNodeDimensions({ node, nodeFromState, isDot }) {
  if (isDot) return { width: DOT_NODE_SIZE, height: DOT_NODE_SIZE };
  
  const width = node?.measured?.width || node?.width || nodeFromState?.width || nodeFromState?.data?.width || 0;
  const height = node?.measured?.height || node?.height || nodeFromState?.height || nodeFromState?.data?.height || 0;
  return { width, height };
}

/**
 * Helper function to round coordinates (handles floating point precision)
 */
function roundCoord(coord) {
  return Math.round(coord * 100) / 100;
}

/**
 * Add dot node center coordinates to alignment maps
 */
function addDotNodeCoords({ nodeId, centerX, centerY, allHorizontalCoords, allVerticalCoords }) {
  if (!allVerticalCoords.has(centerX)) allVerticalCoords.set(centerX, new Set());
  if (!allHorizontalCoords.has(centerY)) allHorizontalCoords.set(centerY, new Set());
  
  allVerticalCoords.get(centerX).add(nodeId);
  allHorizontalCoords.get(centerY).add(nodeId);
}

/**
 * Add regular node coordinates to alignment maps
 */
function addRegularNodeCoords({ nodeId, position, width, height, allHorizontalCoords, allVerticalCoords }) {
  const left = roundCoord(position.x);
  const right = roundCoord(position.x + width);
  const centerX = roundCoord(position.x + width / 2);
  const top = roundCoord(position.y);
  const bottom = roundCoord(position.y + height);
  const centerY = roundCoord(position.y + height / 2);
  
  // Horizontal alignments
  [top, centerY, bottom].forEach(y => {
    if (!allHorizontalCoords.has(y)) allHorizontalCoords.set(y, new Set());
    allHorizontalCoords.get(y).add(nodeId);
  });
  
  // Vertical alignments
  [left, centerX, right].forEach(x => {
    if (!allVerticalCoords.has(x)) allVerticalCoords.set(x, new Set());
    allVerticalCoords.get(x).add(nodeId);
  });
}

/**
 * Helper function to add coordinates to alignment maps
 */
function addAlignmentCoords({
  nodeId,
  position,
  width,
  height,
  isDot,
  allHorizontalCoords,
  allVerticalCoords,
}) {
  if (isDot) {
    const centerX = roundCoord(position.x + width / 2);
    const centerY = roundCoord(position.y + height / 2);
    addDotNodeCoords({ nodeId, centerX, centerY, allHorizontalCoords, allVerticalCoords });
  } else {
    addRegularNodeCoords({ nodeId, position, width, height, allHorizontalCoords, allVerticalCoords });
  }
}

/**
 * Get node from lookup or nodes array
 */
function findNodeById({ activeDraggingNodeId, nodeLookup, nodes }) {
  return nodeLookup.get(activeDraggingNodeId) || nodes.find(n => n.id === activeDraggingNodeId);
}

/**
 * Calculate dot node center coordinates
 */
function calculateDotNodeCenter({ draggingPosition }) {
  return {
    centerX: draggingPosition.x + DOT_NODE_SIZE / 2,
    centerY: draggingPosition.y + DOT_NODE_SIZE / 2,
  };
}

/**
 * Get dot node center coordinates if dragging node is a dot node
 */
function getDotNodeCenter({ activeDraggingNodeId, nodeLookup, nodes }) {
  const node = findNodeById({ activeDraggingNodeId, nodeLookup, nodes });
  if (!node || !isDotNode({ node })) {
    return { centerX: null, centerY: null };
  }
  
  const draggingPosition = getNodePosition({ node, nodeFromState: null, isDraggingNode: true });
  if (!draggingPosition) {
    return { centerX: null, centerY: null };
  }
  
  return calculateDotNodeCenter({ draggingPosition });
}

/**
 * Process a single node and add its alignment coordinates
 */
function processNode({
  nodeFromState,
  nodeFromLookup,
  activeDraggingNodeId,
  allHorizontalCoords,
  allVerticalCoords,
  processedNodeIds,
}) {
  const nodeId = nodeFromState?.id || nodeFromLookup?.id;
  if (!nodeId || processedNodeIds.has(nodeId)) return;
  
  processedNodeIds.add(nodeId);
  const node = nodeFromLookup || nodeFromState;
  if (!node) return;
  
  const isDraggingNode = nodeId === activeDraggingNodeId;
  const position = getNodePosition({ node, nodeFromState, isDraggingNode });
  if (!position || position.x === undefined || position.y === undefined) return;
  
  const dotNode = isDotNode({ node, nodeFromState });
  const { width: nodeWidth, height: nodeHeight } = getNodeDimensions({ node, nodeFromState, isDot: dotNode });
  if (!dotNode && nodeWidth === 0 && nodeHeight === 0) return;
  
  addAlignmentCoords({
    nodeId,
    position,
    width: nodeWidth,
    height: nodeHeight,
    isDot: dotNode,
    allHorizontalCoords,
    allVerticalCoords,
  });
}

/**
 * Collect all nodes to process from both sources
 */
function collectAllNodes({ nodes, nodeLookup }) {
  const nodeIdsFromState = new Set(nodes.map(n => n.id));
  
  return [
    ...nodes.map(node => ({ nodeFromState: node, nodeFromLookup: nodeLookup.get(node.id) })),
    ...Array.from(nodeLookup.entries())
      .filter(([id]) => !nodeIdsFromState.has(id))
      .map(([id, node]) => ({ nodeFromState: null, nodeFromLookup: node }))
  ];
}

/**
 * Add dot node center alignments if dragging a dot node
 */
function addDotNodeCenterAlignments({ dotNodeCenterX, dotNodeCenterY, horizontalAlignments, verticalAlignments }) {
  if (dotNodeCenterY !== null) {
    horizontalAlignments.push({ y: dotNodeCenterY });
  }
  if (dotNodeCenterX !== null) {
    verticalAlignments.push({ x: dotNodeCenterX });
  }
}

/**
 * Check if coordinate should be added (not duplicate of dot node center)
 */
function shouldAddCoordinate({ coord, roundedDotCoord }) {
  return roundedDotCoord === null || Math.abs(roundCoord(coord) - roundedDotCoord) > 0.01;
}

/**
 * Process horizontal coordinate alignments
 */
function processHorizontalAlignments({ allHorizontalCoords, roundedDotY, horizontalAlignments }) {
  for (const [yCoord, nodeIds] of allHorizontalCoords.entries()) {
    if (nodeIds.size >= 2 && shouldAddCoordinate({ coord: yCoord, roundedDotCoord: roundedDotY })) {
      horizontalAlignments.push({ y: yCoord });
    }
  }
}

/**
 * Process vertical coordinate alignments
 */
function processVerticalAlignments({ allVerticalCoords, roundedDotX, verticalAlignments }) {
  for (const [xCoord, nodeIds] of allVerticalCoords.entries()) {
    if (nodeIds.size >= 2 && shouldAddCoordinate({ coord: xCoord, roundedDotCoord: roundedDotX })) {
      verticalAlignments.push({ x: xCoord });
    }
  }
}

/**
 * Extract alignments from coordinate maps
 */
function extractAlignments({ allHorizontalCoords, allVerticalCoords, dotNodeCenterX, dotNodeCenterY }) {
  const horizontalAlignments = [];
  const verticalAlignments = [];
  
  addDotNodeCenterAlignments({ dotNodeCenterX, dotNodeCenterY, horizontalAlignments, verticalAlignments });
  
  const roundedDotY = dotNodeCenterY ? roundCoord(dotNodeCenterY) : null;
  const roundedDotX = dotNodeCenterX ? roundCoord(dotNodeCenterX) : null;
  
  processHorizontalAlignments({ allHorizontalCoords, roundedDotY, horizontalAlignments });
  processVerticalAlignments({ allVerticalCoords, roundedDotX, verticalAlignments });
  
  return { horizontalAlignments, verticalAlignments };
}

/**
 * Calculate canvas bounds for line extension
 */
function calculateCanvasBounds({ viewport, width, height }) {
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

/**
 * Remove duplicate alignments and format for rendering
 */
function formatHelperLines({ horizontalAlignments, verticalAlignments, canvasBounds }) {
  const uniqueHorizontal = Array.from(
    new Map(horizontalAlignments.map(align => [align.y, align])).values()
  );
  const uniqueVertical = Array.from(
    new Map(verticalAlignments.map(align => [align.x, align])).values()
  );
  
  return {
    horizontal: uniqueHorizontal.map(align => ({
      y: align.y,
      startX: canvasBounds.left,
      endX: canvasBounds.right,
    })),
    vertical: uniqueVertical.map(align => ({
      x: align.x,
      startY: canvasBounds.top,
      endY: canvasBounds.bottom,
    })),
  };
}

/**
 * HelperLines component that renders alignment guides when nodes are being dragged
 */
export function HelperLines({ draggingNodeId = null, nodes = [] }) {
  const { getViewport } = useReactFlow();
  const nodeLookup = useStore((state) => state.nodeLookup);
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  
  // Detect dragging node from store if not provided
  const detectedDraggingNodeId = useStore((state) => {
    if (draggingNodeId) return draggingNodeId;
    const allNodes = Array.from(state.nodeLookup.values());
    const draggingNode = allNodes.find(node => 
      node.dragging === true || node.internals?.dragging === true
    );
    return draggingNode?.id || null;
  });
  
  const activeDraggingNodeId = draggingNodeId || detectedDraggingNodeId;
  const nodeLookupSize = nodeLookup.size; // Force re-render when nodeLookup changes
  
  const helperLines = useMemo(() => {
    if (!activeDraggingNodeId) return { horizontal: [], vertical: [] };

    const viewport = getViewport();
    const allHorizontalCoords = new Map();
    const allVerticalCoords = new Map();
    const processedNodeIds = new Set();
    
    // Collect and process all nodes
    const allNodesToProcess = collectAllNodes({ nodes, nodeLookup });
    for (const { nodeFromState, nodeFromLookup } of allNodesToProcess) {
      processNode({
        nodeFromState,
        nodeFromLookup,
        activeDraggingNodeId,
        allHorizontalCoords,
        allVerticalCoords,
        processedNodeIds,
      });
    }
    
    // Get dot node center if dragging a dot node
    const { centerX: dotNodeCenterX, centerY: dotNodeCenterY } = getDotNodeCenter({
      activeDraggingNodeId,
      nodeLookup,
      nodes,
    });
    
    // Extract alignments
    const { horizontalAlignments, verticalAlignments } = extractAlignments({
      allHorizontalCoords,
      allVerticalCoords,
      dotNodeCenterX,
      dotNodeCenterY,
    });
    
    // Calculate canvas bounds and format result
    const canvasBounds = calculateCanvasBounds({ viewport, width, height });
    return formatHelperLines({ horizontalAlignments, verticalAlignments, canvasBounds });
  }, [activeDraggingNodeId, nodeLookup, nodes, getViewport, width, height, nodeLookupSize]);

  if (helperLines.horizontal.length === 0 && helperLines.vertical.length === 0) {
    return null;
  }

  const viewport = getViewport();

  return (
    <div
      className="react-flow__helperlines"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 4,
        overflow: 'visible',
      }}
    >
      <svg
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {helperLines.horizontal.map((line) => {
          const screenY = line.y * viewport.zoom + viewport.y;
          return (
            <line
              key={`h-${line.y}`}
              x1={-50000}
              y1={screenY}
              x2={50000}
              y2={screenY}
              stroke="#ff006e"
              strokeWidth={2}
              strokeDasharray="6,4"
              opacity={0.9}
            />
          );
        })}
        {helperLines.vertical.map((line) => {
          const screenX = line.x * viewport.zoom + viewport.x;
          return (
            <line
              key={`v-${line.x}`}
              x1={screenX}
              y1={-50000}
              x2={screenX}
              y2={50000}
              stroke="#ff006e"
              strokeWidth={2}
              strokeDasharray="6,4"
              opacity={0.9}
            />
          );
        })}
      </svg>
    </div>
  );
}
