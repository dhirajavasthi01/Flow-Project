import { useCallback } from 'react'
import { useTemplateManager } from '../useTemplateManager/useTemplateManager'
import { generateRandom8DigitNumber } from '../../../../utills/flowUtills/FlowUtills'

// --- Pure helper functions (reduce complexity) ---

// Calculates the center point of parent nodes
function calculateTemplateCenter(parentNodes) {
  if (parentNodes.length === 0) {
    return { x: 0, y: 0 }
  }

  const positions = parentNodes.map((n) => n.position || { x: 0, y: 0 })
  const minX = positions.length > 0 ? Math.min(...positions.map((p) => p.x)) : 0
  const maxX = positions.length > 0 ? Math.max(...positions.map((p) => p.x)) : 0
  const minY = positions.length > 0 ? Math.min(...positions.map((p) => p.y)) : 0
  const maxY = positions.length > 0 ? Math.max(...positions.map((p) => p.y)) : 0
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  }
}

// Calculates new position for a parent node based on drop position and center offset
function calculateParentNodePosition(
  nodePosition,
  center,
  dropPosition,
  offset,
) {
  return {
    x: (dropPosition?.x ?? 0) + (nodePosition.x - center.x) + (offset.x || 0),
    y: (dropPosition?.y ?? 0) + (nodePosition.y - center.y) + (offset.y || 0),
  }
}

// Clones a single node with a new ID and updated position (for parent nodes)
function cloneNodeWithNewId(
  node,
  newId,
  dropPosition,
  center,
  offset,
  nodeIdMap,
) {
  nodeIdMap.set(node.id, newId)

  const isChildNode = !!node.parentId
  const newPosition = isChildNode
    ? node.position // Keep child node position unchanged (relative to parent)
    : calculateParentNodePosition(node.position, center, dropPosition, offset)

  return {
    ...node,
    id: newId,
    position: newPosition,
    selected: false,
    dragging: false,
  }
}

// Updates parentId reference for a single node and removes positionAbsolute
function updateNodeParentId(node, nodeIdMap) {
  const updatedNode = { ...node }

  // Remove positionAbsolute - React Flow will recalculate it automatically
  if (updatedNode.positionAbsolute) {
    delete updatedNode.positionAbsolute
  }

  if (node.parentId) {
    const newParentId = nodeIdMap.get(node.parentId)
    if (newParentId) {
      updatedNode.parentId = newParentId
    } else {
      // If parentId doesn't exist in the template, remove it (parent node not included in template)
      updatedNode.parentId = undefined
    }
  }

  return updatedNode
}

// Extracts handle suffix from a handle string
function extractHandleSuffix(handle, nodeId) {
  return handle.replace(nodeId, '')
}

// Clones a single edge with new node IDs
function cloneEdgeWithNewIds(edge, nodeIdMap) {
  const newSource = nodeIdMap.get(edge.source)
  const newTarget = nodeIdMap.get(edge.target)

  if (!newSource || !newTarget) {
    return null
  }

  const sourceHandleSuffix = extractHandleSuffix(edge.sourceHandle, edge.source)
  const targetHandleSuffix = extractHandleSuffix(edge.targetHandle, edge.target)

  const newSourceHandle = `${newSource}${sourceHandleSuffix}`
  const newTargetHandle = `${newTarget}${targetHandleSuffix}`
  const newEdgeId = `xy-edge__${newSource}${newSourceHandle}-${newTarget}${newTargetHandle}`

  return {
    ...edge,
    id: newEdgeId,
    source: newSource,
    target: newTarget,
    sourceHandle: newSourceHandle,
    targetHandle: newTargetHandle,
    selected: false,
  }
}

// Clones all nodes with new IDs
function cloneAllNodes(nodes, dropPosition, center, offset) {
  const nodeIdMap = new Map()

  const clonedNodes = nodes.map((node) => {
    const newId = `${node.nodeType}-${generateRandom8DigitNumber()}`
    return cloneNodeWithNewId(
      node,
      newId,
      dropPosition,
      center,
      offset,
      nodeIdMap,
    )
  })

  return { clonedNodes, nodeIdMap }
}

// Updates parentId references for all nodes
function updateAllParentIds(clonedNodes, nodeIdMap) {
  return clonedNodes.map((node) => updateNodeParentId(node, nodeIdMap))
}

// Clones all edges with new node IDs
function cloneAllEdges(edges, nodeIdMap) {
  return edges
    .map((edge) => cloneEdgeWithNewIds(edge, nodeIdMap))
    .filter(Boolean)
}

export const useTemplateDrop = () => {
  const { getTemplate } = useTemplateManager()

  const cloneTemplate = useCallback(
    (templateId, dropPosition, offset = { x: 20, y: 20 }) => {
      const template = getTemplate(templateId)
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`)
      }

      // Separate parent nodes (nodes without parentId) from child nodes
      const parentNodes = (template.nodes || []).filter((n) => !n.parentId)

      // Calculate center based only on parent nodes (child positions are relative to parent)
      const center = calculateTemplateCenter(parentNodes)

      // First pass: create all nodes with new IDs and build the ID mapping
      const { clonedNodes, nodeIdMap } = cloneAllNodes(
        template.nodes,
        dropPosition,
        center,
        offset,
      )

      // Second pass: update parentId references to use new node IDs
      const nodesWithUpdatedParentIds = updateAllParentIds(
        clonedNodes,
        nodeIdMap,
      )

      // Clone edges with updated node IDs
      const clonedEdges = cloneAllEdges(template.edges || [], nodeIdMap)

      return {
        nodes: nodesWithUpdatedParentIds,
        edges: clonedEdges,
      }
    },
    [getTemplate],
  )

  const calculateOffset = useCallback(
    (dropCount = 0, baseOffset = { x: 20, y: 20 }) => {
      const multiplier = Math.floor(dropCount / 3) + 1
      return {
        x: baseOffset.x * multiplier,
        y: baseOffset.y * multiplier,
      }
    },
    [],
  )

  const handleTemplateDrop = useCallback(
    (templateId, dropPosition, onNodesAdd, onEdgesAdd, dropCount = 0) => {
      try {
        const offset = calculateOffset(dropCount)
        const { nodes, edges } = cloneTemplate(templateId, dropPosition, offset)

        onNodesAdd(nodes)
        onEdgesAdd(edges)

        return { success: true, nodes, edges }
      } catch (error) {
        console.error('Error dropping template:', error)
        return { success: false, error: error.message }
      }
    },
    [cloneTemplate, calculateOffset],
  )

  return {
    cloneTemplate,
    calculateOffset,
    handleTemplateDrop,
  }
}
