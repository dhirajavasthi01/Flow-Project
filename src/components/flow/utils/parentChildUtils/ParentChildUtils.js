/**
 * Utility functions for managing parent-child relationships between nodes
 */

/**
 * Convert absolute position to parent-relative position
 * @param {object} childAbsolutePos - Absolute position {x, y}
 * @param {object} parentPos - Parent's absolute position {x, y}
 * @returns {object} Relative position {x, y}
 */
export const absoluteToRelative = (childAbsolutePos, parentPos) => {
  return {
    x: childAbsolutePos.x - parentPos.x,
    y: childAbsolutePos.y - parentPos.y,
  }
}

/**
 * Convert parent-relative position to absolute position
 * @param {object} relativePos - Relative position {x, y}
 * @param {object} parentPos - Parent's absolute position {x, y}
 * @returns {object} Absolute position {x, y}
 */
export const relativeToAbsolute = (relativePos, parentPos) => {
  return {
    x: relativePos.x + parentPos.x,
    y: relativePos.y + parentPos.y,
  }
}

/**
 * Check if a point (absolute coordinates) is within a node's bounds
 * @param {object} point - Point coordinates {x, y}
 * @param {object} node - Node object with position and dimensions
 * @returns {boolean} True if point is within node bounds
 */
export const isPointInNode = (point, node) => {
  if (!node.position) return false

  const nodeWidth = node.width || node.data?.width || 150
  const nodeHeight = node.height || node.data?.height || 150

  return (
    point.x >= node.position.x &&
    point.x <= node.position.x + nodeWidth &&
    point.y >= node.position.y &&
    point.y <= node.position.y + nodeHeight
  )
}

/**
 * Get all child nodes for a given parent node ID
 * @param {array} nodes - Array of all nodes
 * @param {string} parentId - Parent node ID
 * @returns {array} Array of child nodes
 */
export const getChildNodes = (nodes, parentId) => {
  return nodes.filter((node) => node.parentId === parentId)
}

/**
 * Check if a node can be a parent (not already a child and not itself)
 * @param {object} node - Node to check
 * @returns {boolean} True if node can be a parent
 */
export const canBeParent = (node) => {
  return !node.parentId // A node that already has a parent cannot become a parent
}

/**
 * Check if attaching child to parent would create a circular dependency
 * @param {array} nodes - Array of all nodes
 * @param {string} childId - Child node ID
 * @param {string} parentId - Parent node ID
 * @returns {boolean} True if circular dependency would be created
 */
export const wouldCreateCircularDependency = (nodes, childId, parentId) => {
  if (childId === parentId) return true

  // Check if the parent is a descendant of the child
  let currentParentId = parentId
  const visited = new Set()

  while (currentParentId) {
    if (visited.has(currentParentId)) break // Prevent infinite loop
    visited.add(currentParentId)

    if (currentParentId === childId) {
      return true // Circular dependency detected
    }

    const parentNode = nodes.find((n) => n.id === currentParentId)
    if (!parentNode?.parentId) break

    currentParentId = parentNode.parentId
  }

  return false
}

/**
 * Get all descendant node IDs (children and their children)
 * @param {array} nodes - Array of all nodes
 * @param {string} parentId - Parent node ID
 * @returns {Set} Set of descendant node IDs
 */
export const getDescendantIds = (nodes, parentId) => {
  const descendants = new Set()
  const queue = [parentId]

  while (queue.length > 0) {
    const currentId = queue.shift()
    const children = nodes.filter((n) => n.parentId === currentId)

    children.forEach((child) => {
      descendants.add(child.id)
      queue.push(child.id)
    })
  }

  return descendants
}

/**
 * Helper function to check if a node is a Dot node
 * @param {object} node - Node to check
 * @returns {boolean} True if node is a Dot node
 */
const isDotNode = (node) => {
  return node?.type?.includes('dotNode') || node?.nodeType?.includes('dot-node')
}

/**
 * Helper function to check if a node is a TextBox/TextNode
 * @param {object} node - Node to check
 * @returns {boolean} True if node is a TextBox node
 */
const isTextBoxNode = (node) => {
  return (
    node?.type === 'textBoxNode' ||
    node?.nodeType === 'text-box-node' ||
    node?.type?.includes('textBox')
  )
}

/**
 * Check if a node can act as a group/board (any node can be a parent, except Dot nodes and TextBox nodes)
 * @param {object} node - Node to check
 * @returns {boolean} True if node can be a parent
 */
export const canBeGroupNode = (node) => {
  // Dot nodes cannot be parent nodes
  if (isDotNode(node)) return false
  // TextBox nodes cannot be parent nodes
  if (isTextBoxNode(node)) return false
  // Any node without a parent can be a group node (except Dot nodes and TextBox nodes)
  return !node.parentId
}

/**
 * Find all nodes that can act as group/board nodes
 * @param {array} nodes - Array of all nodes
 * @returns {array} Array of nodes that can be parents
 */
export const getGroupNodes = (nodes) => {
  return nodes.filter((node) => canBeGroupNode(node))
}

/**
 * Find the node (group/board) that contains a given point
 * @param {array} nodes - Array of all nodes
 * @param {object} point - Point coordinates {x, y} (absolute)
 * @param {string} excludeNodeId - Node ID to exclude from search
 * @returns {object|null} Node that contains the point, or null
 */
export const findGroupNodeAtPoint = (nodes, point, excludeNodeId = null) => {
  // Helper function to check if a node is a Dot node
  const isDotNode = (node) => {
    return (
      node?.type?.includes('dotNode') || node?.nodeType?.includes('dot-node')
    )
  }

  // Helper function to check if a node is a TextBox/TextNode
  const isTextBoxNode = (node) => {
    return (
      node?.type === 'textBoxNode' ||
      node?.nodeType === 'text-box-node' ||
      node?.type?.includes('textBox')
    )
  }

  // Find any node that can be a parent and contains the point
  // Sort by z-index or size (larger nodes first) to handle overlapping nodes
  // CRITICAL: Dot nodes and TextBox nodes cannot be parent nodes
  const candidateNodes = nodes
    .filter((node) => {
      if (excludeNodeId && node.id === excludeNodeId) return false
      if (node.parentId) return false // Nodes with parents can't be group nodes
      if (isDotNode(node)) return false // Dot nodes cannot be parent nodes
      if (isTextBoxNode(node)) return false // TextBox nodes cannot be parent nodes
      return true
    })
    .map((node) => {
      const nodeWidth = node.width || node.data?.width || 150
      const nodeHeight = node.height || node.data?.height || 150
      const area = nodeWidth * nodeHeight
      return { node, area }
    })
    .sort((a, b) => b.area - a.area) // Larger nodes first

  for (const { node } of candidateNodes) {
    const nodePos = node.positionAbsolute || node.position
    if (nodePos && isPointInNode(point, { ...node, position: nodePos })) {
      return node
    }
  }

  return null
}

/**
 * Sort nodes to ensure parents appear before their children
 * @param {array} nodes - Array of nodes to sort
 * @returns {array} Sorted array of nodes
 */
export const sortNodesByParentChild = (nodes) => {
  const sorted = []
  const processed = new Set()

  // First, add all nodes without parents
  nodes.forEach((node) => {
    if (!node.parentId) {
      sorted.push(node)
      processed.add(node.id)
    }
  })

  // Then, recursively add children
  const addChildren = (parentId) => {
    nodes.forEach((node) => {
      if (node.parentId === parentId && !processed.has(node.id)) {
        sorted.push(node)
        processed.add(node.id)
        addChildren(node.id)
      }
    })
  }

  // Add children for all parent nodes
  sorted.forEach((node) => {
    addChildren(node.id)
  })

  // Add any remaining nodes (shouldn't happen in valid hierarchy)
  nodes.forEach((node) => {
    if (!processed.has(node.id)) {
      sorted.push(node)
    }
  })

  return sorted
}
