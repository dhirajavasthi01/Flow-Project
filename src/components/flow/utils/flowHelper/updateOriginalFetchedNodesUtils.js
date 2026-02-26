/**
 * Helpers for updateOriginalFetchedNodesRef.
 * Extracted to keep Flow.jsx cognitive complexity low.
 */

/**
 * Returns a node with width/height synced to root, style, and data.
 */
export function nodeWithSyncedDimensions(node, getNodeDimensionHightAndWidth) {
  const nodeWidth = getNodeDimensionHightAndWidth(
    node,
    'width',
    node.data?.width,
  )
  const nodeHeight = getNodeDimensionHightAndWidth(
    node,
    'height',
    node.data?.height,
  )
  return {
    ...node,
    width: nodeWidth,
    height: nodeHeight,
    style: {
      ...node.style,
      width: nodeWidth,
      height: nodeHeight,
    },
    data: {
      ...node.data,
      width: nodeWidth,
      height: nodeHeight,
    },
  }
}

/**
 * Returns Set of node ids that are resized (dimensions changed) or new (not in original).
 */
export function getResizedNodeIds(
  finalNodes,
  originalNodes,
  getNodeDimensionHightAndWidth,
  CompareValuesWithSymbol,
) {
  const resizedNodeIds = new Set()
  finalNodes.forEach((node) => {
    const originalNode = originalNodes.find((n) => n.id === node.id)
    if (originalNode) {
      const originalWidth = Number(
        getNodeDimensionHightAndWidth(
          originalNode,
          'width',
          originalNode.data?.width,
        ),
      )
      const originalHeight = Number(
        getNodeDimensionHightAndWidth(
          originalNode,
          'height',
          originalNode.data?.height,
        ),
      )
      const newWidth = Number(
        getNodeDimensionHightAndWidth(node, 'width', node.data?.width),
      )
      const newHeight = Number(
        getNodeDimensionHightAndWidth(node, 'height', node.data?.height),
      )
      const allValid = CompareValuesWithSymbol(
        '&&',
        !isNaN(originalWidth),
        !isNaN(originalHeight),
        !isNaN(newWidth),
        !isNaN(newHeight),
      )
      if (allValid) {
        const dimensionsChanged = CompareValuesWithSymbol(
          '||',
          originalWidth !== newWidth,
          originalHeight !== newHeight,
        )
        if (dimensionsChanged) resizedNodeIds.add(node.id)
      }
    } else {
      const newWidth = Number(
        getNodeDimensionHightAndWidth(node, 'width', node.data?.width),
      )
      const newHeight = Number(
        getNodeDimensionHightAndWidth(node, 'height', node.data?.height),
      )
      if (
        CompareValuesWithSymbol('&&', !isNaN(newWidth), !isNaN(newHeight))
      ) {
        resizedNodeIds.add(node.id)
      }
    }
  })
  return resizedNodeIds
}

/**
 * Returns true if any node has parentId or position change compared to original.
 */
export function hasParentOrPositionChanges(
  finalNodes,
  originalNodes,
  CompareValuesWithSymbol,
) {
  return finalNodes.some((node) => {
    const originalNode = originalNodes.find((n) => n.id === node.id)
    if (!originalNode) return false
    const parentIdChanged = node.parentId !== originalNode.parentId
    const positionChanged = CompareValuesWithSymbol(
      '&&',
      node.position,
      originalNode.position,
      CompareValuesWithSymbol(
        '||',
        node.position.x !== originalNode.position.x,
        node.position.y !== originalNode.position.y,
      ),
    )
    return CompareValuesWithSymbol('||', parentIdChanged, positionChanged)
  })
}

/**
 * Pushes nodes from finalNodes that are not in originalRef to originalRef.current.
 */
export function addNewNodesToOriginal(
  originalRef,
  finalNodes,
  getNodeDimensionHightAndWidth,
  nodeWithSyncedDimensionsFn,
) {
  finalNodes.forEach((node) => {
    if (!originalRef.current.find((n) => n.id === node.id)) {
      originalRef.current.push(
        nodeWithSyncedDimensionsFn(node, getNodeDimensionHightAndWidth),
      )
    }
  })
}

/**
 * Returns updated original nodes array: resized nodes updated with dimensions (and parent/position if changed),
 * non-resized nodes updated for parent/position only when changed, others unchanged.
 */
export function applyResizedAndReparentedUpdates(
  originalNodes,
  finalNodes,
  resizedNodeIds,
  getNodeDimensionHightAndWidth,
  CompareValuesWithSymbol,
  getValsBaseOnCondition,
) {
  return originalNodes.map((originalNode) => {
    const updatedNode = finalNodes.find((n) => n.id === originalNode.id)
    const isResized = resizedNodeIds.has(originalNode.id)

    if (updatedNode && isResized) {
      const updatedWidth = getNodeDimensionHightAndWidth(
        updatedNode,
        'width',
        updatedNode.data?.width,
      )
      const updatedHeight = getNodeDimensionHightAndWidth(
        updatedNode,
        'height',
        updatedNode.data?.height,
      )
      const parentIdChanged =
        updatedNode.parentId !== originalNode.parentId
      const positionChanged = CompareValuesWithSymbol(
        '&&',
        updatedNode.position,
        originalNode.position,
        CompareValuesWithSymbol(
          '||',
          updatedNode.position.x !== originalNode.position.x,
          updatedNode.position.y !== originalNode.position.y,
        ),
      )
      return {
        ...originalNode,
        width: updatedWidth,
        height: updatedHeight,
        parentId: getValsBaseOnCondition(
          parentIdChanged,
          updatedNode.parentId,
          originalNode.parentId,
        ),
        position: getValsBaseOnCondition(
          CompareValuesWithSymbol('||', parentIdChanged, positionChanged),
          updatedNode.position,
          originalNode.position,
        ),
        positionAbsolute: getValsBaseOnCondition(
          parentIdChanged,
          updatedNode.positionAbsolute,
          originalNode.positionAbsolute,
        ),
        style: {
          ...originalNode.style,
          width: updatedWidth,
          height: updatedHeight,
          ...Object.fromEntries(
            Object.entries(updatedNode.style || {}).filter(
              ([key]) => key !== 'width' && key !== 'height',
            ),
          ),
        },
        data: {
          ...originalNode.data,
          width: updatedWidth,
          height: updatedHeight,
        },
      }
    }

    if (updatedNode) {
      const parentIdChanged =
        updatedNode.parentId !== originalNode.parentId
      const positionChanged = CompareValuesWithSymbol(
        '&&',
        updatedNode.position,
        originalNode.position,
        CompareValuesWithSymbol(
          '||',
          updatedNode.position.x !== originalNode.position.x,
          updatedNode.position.y !== originalNode.position.y,
        ),
      )
      if (CompareValuesWithSymbol('||', parentIdChanged, positionChanged)) {
        return {
          ...originalNode,
          parentId: getValsBaseOnCondition(
            parentIdChanged,
            updatedNode.parentId,
            originalNode.parentId,
          ),
          position: getValsBaseOnCondition(
            CompareValuesWithSymbol('||', parentIdChanged, positionChanged),
            updatedNode.position,
            originalNode.position,
          ),
          positionAbsolute: getValsBaseOnCondition(
            parentIdChanged,
            updatedNode.positionAbsolute,
            originalNode.positionAbsolute,
          ),
        }
      }
    }

    return originalNode
  })
}
