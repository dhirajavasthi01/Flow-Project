// ============================================
// NODE DIMENSION HELPER FUNCTIONS
// ============================================

/**
 * Process all nodes to detect dimension changes
 * EXACTLY matches original forEach logic
 */
export const checkForDimensionChanges = ({
  nodes,
  prevNodeDimensionsRef,
  originalFetchedNodesRef,
  getNodeDimension,
  CompareValuesWithSymbol,
}) => {
  let hasDimensionChanges = false

  nodes.forEach((node) => {
    let prevDims = prevNodeDimensionsRef.current.get(node.id)

    // This matches getValidNodeDimensions EXACTLY
    const getValidNodeDimensions = () => {
      if (prevDims) return null

      // Using find with arrow function to match original exactly
      const originalNode = originalFetchedNodesRef.current.find(
        (n) => n.id === node.id,
      )
      if (!originalNode) return null

      const width = getNodeDimension(originalNode, 'width')
      const height = getNodeDimension(originalNode, 'height')

      const isValid = CompareValuesWithSymbol(
        '&&',
        !isNaN(width),
        !isNaN(height),
      )

      return isValid ? { width, height } : null
    }

    const dimensions = getValidNodeDimensions()
    if (dimensions) {
      prevDims = dimensions
      prevNodeDimensionsRef.current.set(node.id, dimensions)
    }

    const currentWidth = getNodeDimension(node, 'width')
    const currentHeight = getNodeDimension(node, 'height')

    if (
      !CompareValuesWithSymbol(
        '&&',
        !isNaN(currentWidth),
        !isNaN(currentHeight),
      )
    ) {
      return // matches original return (just exits this iteration)
    }

    if (!prevDims) {
      prevNodeDimensionsRef.current.set(node.id, {
        width: currentWidth,
        height: currentHeight,
      })
      return // matches original return
    }

    const prevWidth = Number(prevDims.width)
    const prevHeight = Number(prevDims.height)

    if (CompareValuesWithSymbol('&&', !isNaN(prevWidth), !isNaN(prevHeight))) {
      if (
        CompareValuesWithSymbol(
          '||',
          prevWidth !== currentWidth,
          prevHeight !== currentHeight,
        )
      ) {
        hasDimensionChanges = true
      }
    }
  })

  return hasDimensionChanges
}

/**
 * Handle case when dimensions haven't changed
 * EXACTLY matches original else branch
 */
export const updateCurrentDimensions = ({
  nodes,
  prevNodeDimensionsRef,
  getNodeDimension,
  CompareValuesWithSymbol,
}) => {
  nodes.forEach((node) => {
    const currentWidth = getNodeDimension(node, 'width')
    const currentHeight = getNodeDimension(node, 'height')
    if (
      CompareValuesWithSymbol('&&', !isNaN(currentWidth), !isNaN(currentHeight))
    ) {
      prevNodeDimensionsRef.current.set(node.id, {
        width: currentWidth,
        height: currentHeight,
      })
    }
  })
}

/**
 * Setup timeout for storing dimensions
 * EXACTLY matches original timeout logic
 */
export const checkAndAddResizedNode = ({
  node,
  originalNode,
  resizedNodeIds,
  getNodeDimensionHightAndWidth,
  CompareValuesWithSymbol,
}) => {
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

    if (
      CompareValuesWithSymbol(
        '&&',
        !isNaN(originalWidth),
        !isNaN(originalHeight),
        !isNaN(newWidth),
        !isNaN(newHeight),
      )
    ) {
      if (
        CompareValuesWithSymbol(
          '||',
          originalWidth !== newWidth,
          originalHeight !== newHeight,
        )
      ) {
        resizedNodeIds.add(node.id)
      }
    }
  } else {
    // Node doesn't exist in originalFetchedNodesRef, so it's a new node - treat as resized
    const newWidth = Number(
      getNodeDimensionHightAndWidth(node, 'width', node.data?.width),
    )

    const newHeight = Number(
      getNodeDimensionHightAndWidth(node, 'height', node.data?.height),
    )

    if (CompareValuesWithSymbol('&&', !isNaN(newWidth), !isNaN(newHeight))) {
      resizedNodeIds.add(node.id)
    }
  }
}
