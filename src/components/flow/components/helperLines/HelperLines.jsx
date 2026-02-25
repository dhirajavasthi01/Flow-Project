import { useMemo } from 'react'
import { useReactFlow, useStore } from '@xyflow/react'
import {
  addDotNodeCenterAlignments,
  addDotNodeCoords,
  calculateCanvasBounds,
  calculateDotNodeCenter,
  getNodeDimensions,
  isDotNode,
} from './HelperLines.functions'
import { CompareValuesWithSymbol } from '../../../../utills/nodeNameUtils/nodeNameUtils'

function getNodePosition({ node, nodeFromState, isDraggingNode }) {
  //Helper function to get node position
  if (
    CompareValuesWithSymbol(
      '&&',
      isDraggingNode,
      node?.internals?.positionAbsolute,
    )
  ) {
    return node.internals.positionAbsolute
  }
  if (nodeFromState?.position) {
    return {
      x: nodeFromState.position.x || 0,
      y: nodeFromState.position.y || 0,
    }
  }
  if (node?.internals?.positionAbsolute) {
    return node.internals.positionAbsolute
  }
  if (node?.position) {
    return { x: node.position.x || 0, y: node.position.y || 0 }
  }
  return null
}

function roundCoord(coord) {
  //Helper function to round coordinates (handles floating point precision)
  return Math.round(coord * 100) / 100
}

function addRegularNodeCoords({
  nodeId,
  position,
  width,
  height,
  allHorizontalCoords,
  allVerticalCoords,
}) {
  //Add regular node coordinates to alignment maps
  const left = roundCoord(position.x)
  const right = roundCoord(position.x + width)
  const centerX = roundCoord(position.x + width / 2)
  const top = roundCoord(position.y)
  const bottom = roundCoord(position.y + height)
  const centerY = roundCoord(position.y + height / 2)
  ;[top, centerY, bottom].forEach((y) => {
    // Horizontal alignments
    if (!allHorizontalCoords.has(y)) allHorizontalCoords.set(y, new Set())
    allHorizontalCoords.get(y).add(nodeId)
  })
  ;[left, centerX, right].forEach((x) => {
    // Vertical alignments
    if (!allVerticalCoords.has(x)) allVerticalCoords.set(x, new Set())
    allVerticalCoords.get(x).add(nodeId)
  })
}

function addAlignmentCoords({
  //Helper function to add coordinates to alignment maps
  nodeId,
  position,
  width,
  height,
  isDot,
  allHorizontalCoords,
  allVerticalCoords,
}) {
  if (isDot) {
    const centerX = roundCoord(position.x + width / 2)
    const centerY = roundCoord(position.y + height / 2)
    addDotNodeCoords({
      nodeId,
      centerX,
      centerY,
      allHorizontalCoords,
      allVerticalCoords,
    })
  } else {
    addRegularNodeCoords({
      nodeId,
      position,
      width,
      height,
      allHorizontalCoords,
      allVerticalCoords,
    })
  }
}

function findNodeById({ activeDraggingNodeId, nodeLookup, nodes }) {
  //Get node from lookup or nodes array
  return (
    nodeLookup.get(activeDraggingNodeId) ||
    nodes.find((n) => n.id === activeDraggingNodeId)
  )
}

function getDotNodeCenter({ activeDraggingNodeId, nodeLookup, nodes }) {
  //Get dot node center coordinates if dragging node is a dot node
  const node = findNodeById({ activeDraggingNodeId, nodeLookup, nodes })
  if (!node || !isDotNode({ node })) {
    return { centerX: null, centerY: null }
  }
  const draggingPosition = getNodePosition({
    node,
    nodeFromState: null,
    isDraggingNode: true,
  })
  if (!draggingPosition) {
    return { centerX: null, centerY: null }
  }
  return calculateDotNodeCenter({ draggingPosition })
}

function processNode({
  //Process a single node and add its alignment coordinates
  nodeFromState,
  nodeFromLookup,
  activeDraggingNodeId,
  allHorizontalCoords,
  allVerticalCoords,
  processedNodeIds,
}) {
  const nodeId = nodeFromState?.id || nodeFromLookup?.id
  if (!nodeId || processedNodeIds.has(nodeId)) return
  processedNodeIds.add(nodeId)
  const node = nodeFromLookup || nodeFromState
  if (!node) return
  const isDraggingNode = nodeId === activeDraggingNodeId
  const position = getNodePosition({ node, nodeFromState, isDraggingNode })
  if (!position || position.x === undefined || position.y === undefined) return
  const dotNode = isDotNode({ node, nodeFromState })
  const { width: nodeWidth, height: nodeHeight } = getNodeDimensions({
    node,
    nodeFromState,
    isDot: dotNode,
  })
  if (!dotNode && nodeWidth === 0 && nodeHeight === 0) return

  addAlignmentCoords({
    nodeId,
    position,
    width: nodeWidth,
    height: nodeHeight,
    isDot: dotNode,
    allHorizontalCoords,
    allVerticalCoords,
  })
}

function collectAllNodes({ nodes, nodeLookup }) {
  // Collect all nodes to process from both sources
  const nodeIdsFromState = new Set(nodes.map((n) => n.id))
  return [
    ...nodes.map((node) => ({
      nodeFromState: node,
      nodeFromLookup: nodeLookup.get(node.id),
    })),
    ...Array.from(nodeLookup.entries())
      .filter(([id]) => !nodeIdsFromState.has(id))
      .map(([node]) => ({ nodeFromState: null, nodeFromLookup: node })),
  ]
}

function shouldAddCoordinate({ coord, roundedDotCoord }) {
  //Check if coordinate should be added (not duplicate of dot node center)
  return (
    roundedDotCoord === null ||
    Math.abs(roundCoord(coord) - roundedDotCoord) > 0.01
  )
}

function processHorizontalAlignments({
  allHorizontalCoords,
  roundedDotY,
  horizontalAlignments,
}) {
  //Process horizontal coordinate alignments
  for (const [yCoord, nodeIds] of allHorizontalCoords.entries()) {
    if (
      nodeIds.size >= 2 &&
      shouldAddCoordinate({ coord: yCoord, roundedDotCoord: roundedDotY })
    ) {
      horizontalAlignments.push({ y: yCoord })
    }
  }
}

function processVerticalAlignments({
  allVerticalCoords,
  roundedDotX,
  verticalAlignments,
}) {
  //Process vertical coordinate alignments
  for (const [xCoord, nodeIds] of allVerticalCoords.entries()) {
    if (
      nodeIds.size >= 2 &&
      shouldAddCoordinate({ coord: xCoord, roundedDotCoord: roundedDotX })
    ) {
      verticalAlignments.push({ x: xCoord })
    }
  }
}

function extractAlignments({
  allHorizontalCoords,
  allVerticalCoords,
  dotNodeCenterX,
  dotNodeCenterY,
}) {
  //Extract alignments from coordinate maps
  const horizontalAlignments = []
  const verticalAlignments = []
  addDotNodeCenterAlignments({
    dotNodeCenterX,
    dotNodeCenterY,
    horizontalAlignments,
    verticalAlignments,
  })
  const roundedDotY = dotNodeCenterY ? roundCoord(dotNodeCenterY) : null
  const roundedDotX = dotNodeCenterX ? roundCoord(dotNodeCenterX) : null
  processHorizontalAlignments({
    allHorizontalCoords,
    roundedDotY,
    horizontalAlignments,
  })
  processVerticalAlignments({
    allVerticalCoords,
    roundedDotX,
    verticalAlignments,
  })
  return { horizontalAlignments, verticalAlignments }
}

function formatHelperLines({
  horizontalAlignments,
  verticalAlignments,
  canvasBounds,
}) {
  //Remove duplicate alignments and format for rendering
  const uniqueHorizontal = Array.from(
    new Map(horizontalAlignments.map((align) => [align.y, align])).values(),
  )
  const uniqueVertical = Array.from(
    new Map(verticalAlignments.map((align) => [align.x, align])).values(),
  )

  return {
    horizontal: uniqueHorizontal.map((align) => ({
      y: align.y,
      startX: canvasBounds.left,
      endX: canvasBounds.right,
    })),
    vertical: uniqueVertical.map((align) => ({
      x: align.x,
      startY: canvasBounds.top,
      endY: canvasBounds.bottom,
    })),
  }
}

export function HelperLines({ draggingNodeId = null, nodes = [] }) {
  //HelperLines component that renders alignment guides when nodes are being dragged
  const { getViewport } = useReactFlow()
  const nodeLookup = useStore((state) => state.nodeLookup)
  const width = useStore((state) => state.width)
  const height = useStore((state) => state.height)

  const detectedDraggingNodeId = useStore((state) => {
    // Detect dragging node from store if not provided
    if (draggingNodeId) return draggingNodeId
    const allNodes = Array.from(state.nodeLookup.values())
    const draggingNode = allNodes.find(
      (node) => node.dragging === true || node.internals?.dragging === true,
    )
    return draggingNode?.id || null
  })

  const activeDraggingNodeId = draggingNodeId || detectedDraggingNodeId
  const nodeLookupSize = nodeLookup.size

  const helperLines = useMemo(() => {
    if (!activeDraggingNodeId) return { horizontal: [], vertical: [] }
    const viewport = getViewport()
    const allHorizontalCoords = new Map()
    const allVerticalCoords = new Map()
    const processedNodeIds = new Set()

    const allNodesToProcess = collectAllNodes({ nodes, nodeLookup }) // Collect and process all nodes
    for (const { nodeFromState, nodeFromLookup } of allNodesToProcess) {
      processNode({
        nodeFromState,
        nodeFromLookup,
        activeDraggingNodeId,
        allHorizontalCoords,
        allVerticalCoords,
        processedNodeIds,
      })
    }

    const { centerX: dotNodeCenterX, centerY: dotNodeCenterY } =
      getDotNodeCenter({
        // Get dot node center if dragging a dot node
        activeDraggingNodeId,
        nodeLookup,
        nodes,
      })

    const { horizontalAlignments, verticalAlignments } = extractAlignments({
      // Extract alignments
      allHorizontalCoords,
      allVerticalCoords,
      dotNodeCenterX,
      dotNodeCenterY,
    })

    const canvasBounds = calculateCanvasBounds({ viewport, width, height }) // Calculate canvas bounds and format result
    return formatHelperLines({
      horizontalAlignments,
      verticalAlignments,
      canvasBounds,
    })
  }, [
    activeDraggingNodeId,
    nodeLookup,
    nodes,
    getViewport,
    width,
    height,
    nodeLookupSize,
  ])
  if (
    helperLines.horizontal.length === 0 &&
    helperLines.vertical.length === 0
  ) {
    return null
  }

  const viewport = getViewport()

  return (
    <div
      className='react-flow__helperlines'
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
          const screenY = line.y * viewport.zoom + viewport.y
          return (
            <line
              key={`h-${line.y}`}
              x1={-50000}
              y1={screenY}
              x2={50000}
              y2={screenY}
              stroke='#ff006e'
              strokeWidth={2}
              strokeDasharray='6,4'
              opacity={0.9}
            />
          )
        })}
        {helperLines.vertical.map((line) => {
          const screenX = line.x * viewport.zoom + viewport.x
          return (
            <line
              key={`v-${line.x}`}
              x1={screenX}
              y1={-50000}
              x2={screenX}
              y2={50000}
              stroke='#ff006e'
              strokeWidth={2}
              strokeDasharray='6,4'
              opacity={0.9}
            />
          )
        })}
      </svg>
    </div>
  )
}
