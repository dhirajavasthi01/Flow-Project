/**
 * Pure helpers for onNodeDragStop: attach, detach, and snap.
 * Extracted to keep Flow.jsx cognitive complexity low.
 */

import {
  absoluteToRelative,
  relativeToAbsolute,
  sortNodesByParentChild,
} from '../parentChildUtils/ParentChildUtils'

function isDotNode(node) {
  return node?.type?.includes('dotNode') || node?.nodeType?.includes('dot-node')
}

function isTextBoxNode(node) {
  return (
    node?.type === 'textBoxNode' ||
    node?.nodeType === 'text-box-node' ||
    node?.type?.includes('textBox')
  )
}

export function isValidNewParent(newParent) {
  return !!(
    newParent &&
    !newParent.parentId &&
    !isDotNode(newParent) &&
    !isTextBoxNode(newParent)
  )
}

export function computeRelativePosForAttach(
  draggedNode,
  newParent,
  oldParentId,
  currentNodes,
) {
  const draggedAbsolutePos =
    draggedNode.positionAbsolute || draggedNode.position
  const parentAbsolutePos = newParent.positionAbsolute || newParent.position
  if (!draggedAbsolutePos || !parentAbsolutePos) return null

  if (oldParentId) {
    const oldParent = currentNodes.find((n) => n.id === oldParentId)
    if (oldParent) {
      const oldParentAbsolutePos =
        oldParent.positionAbsolute || oldParent.position
      const absoluteFromOld = relativeToAbsolute(
        draggedNode.position,
        oldParentAbsolutePos,
      )
      return absoluteToRelative(absoluteFromOld, parentAbsolutePos)
    }
    return absoluteToRelative(draggedAbsolutePos, parentAbsolutePos)
  }
  return absoluteToRelative(draggedAbsolutePos, parentAbsolutePos)
}

export function computeDetachAbsolutePos(draggedNode, oldParent) {
  const oldParentAbsolutePos = oldParent.positionAbsolute || oldParent.position
  if (!oldParentAbsolutePos) return null
  return relativeToAbsolute(draggedNode.position, oldParentAbsolutePos)
}

export function getPositionForSnapping(draggedNode, currentNodes) {
  let positionForSnapping = draggedNode.positionAbsolute || draggedNode.position
  if (draggedNode.parentId && !draggedNode.positionAbsolute) {
    const parentNode = currentNodes.find((n) => n.id === draggedNode.parentId)
    const parentAbs = parentNode?.positionAbsolute ?? parentNode?.position
    if (parentAbs) {
      positionForSnapping = relativeToAbsolute(draggedNode.position, parentAbs)
    }
    if (positionForSnapping === draggedNode.position) {
      positionForSnapping = null
    }
  }
  return positionForSnapping
}

const SNAP_THRESHOLD_MIN = 0.1
const SNAP_THRESHOLD_MAX = 5

export function shouldApplySnap(positionForSnapping, snappedPosition) {
  const xDiff = Math.abs(snappedPosition.x - positionForSnapping.x)
  const yDiff = Math.abs(snappedPosition.y - positionForSnapping.y)
  return (
    (xDiff > SNAP_THRESHOLD_MIN || yDiff > SNAP_THRESHOLD_MIN) &&
    xDiff <= SNAP_THRESHOLD_MAX &&
    yDiff <= SNAP_THRESHOLD_MAX
  )
}

export function mapNodesWithAttach(
  nds,
  nodeId,
  potentialParentId,
  relativePos,
) {
  const updatedNodes = nds.map((n) => {
    if (n.id === nodeId) {
      return {
        ...n,
        parentId: potentialParentId,
        position: relativePos,
        extent: 'parent',
        data: { ...n.data, isAttachedToGroup: true },
      }
    }
    return n
  })
  return sortNodesByParentChild(updatedNodes)
}

export function mapNodesWithDetach(nds, nodeId, absolutePos) {
  const updatedNodes = nds.map((n) => {
    if (n.id === nodeId) {
      return {
        ...n,
        parentId: undefined,
        position: absolutePos,
        extent: undefined,
        data: { ...n.data, isAttachedToGroup: false },
      }
    }
    return n
  })
  return sortNodesByParentChild(updatedNodes)
}

export function mapNodesWithSnap(nds, nodeId, snappedPosition) {
  return nds.map((n) => {
    if (n.id !== nodeId) return n
    if (n.parentId) {
      const parentNode = nds.find((p) => p.id === n.parentId)
      const parentAbsolutePos =
        parentNode?.positionAbsolute ?? parentNode?.position
      if (parentAbsolutePos) {
        return {
          ...n,
          position: absoluteToRelative(snappedPosition, parentAbsolutePos),
        }
      }
    }
    return { ...n, position: snappedPosition }
  })
}

export function isDotNodeType(node) {
  return isDotNode(node)
}

/**
 * Decide what drag-stop action to take (attach, detach, snap, or none).
 * Returns an action object so the caller can apply it with minimal branching.
 * @returns {{ type: 'attach'|'detach'|'snap'|'none', nodeId?: string, potentialParentId?: string, relativePos?: object, absolutePos?: object, snappedPosition?: object }}
 */
export function getDragStopAction(
  currentNodes,
  draggedNode,
  nodeId,
  potentialParentId,
  snapNodePositionFn,
  node,
) {
  const hasParent = !!draggedNode.parentId
  const oldParentId = draggedNode.parentId

  if (potentialParentId && potentialParentId !== oldParentId) {
    const newParent = currentNodes.find((n) => n.id === potentialParentId)
    if (isValidNewParent(newParent)) {
      const relativePos = computeRelativePosForAttach(
        draggedNode,
        newParent,
        oldParentId,
        currentNodes,
      )
      if (relativePos) {
        return {
          type: 'attach',
          nodeId,
          potentialParentId,
          relativePos,
        }
      }
    }
  }

  if (hasParent && !potentialParentId) {
    const oldParent = currentNodes.find((n) => n.id === oldParentId)
    if (oldParent) {
      const absolutePos = computeDetachAbsolutePos(draggedNode, oldParent)
      if (absolutePos) {
        return { type: 'detach', nodeId, absolutePos }
      }
    }
  }

  if (isDotNodeType(node) || !node.position) {
    return { type: 'none' }
  }

  const positionForSnapping = getPositionForSnapping(draggedNode, currentNodes)
  if (!positionForSnapping) {
    return { type: 'none' }
  }

  const snappedPosition = snapNodePositionFn(nodeId, positionForSnapping)
  if (!shouldApplySnap(positionForSnapping, snappedPosition)) {
    return { type: 'none' }
  }

  return { type: 'snap', nodeId, snappedPosition }
}
