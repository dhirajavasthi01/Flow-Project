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
  };
};

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
  };
};

/**
 * Check if a point (absolute coordinates) is within a node's bounds
 * @param {object} point - Point coordinates {x, y}
 * @param {object} node - Node object with position and dimensions
 * @returns {boolean} True if point is within node bounds
 */
export const isPointInNode = (point, node) => {
  if (!node.position) return false;
  
  const nodeWidth = node.width || node.data?.width || 150;
  const nodeHeight = node.height || node.data?.height || 150;
  
  return (
    point.x >= node.position.x &&
    point.x <= node.position.x + nodeWidth &&
    point.y >= node.position.y &&
    point.y <= node.position.y + nodeHeight
  );
};

/**
 * Get all child nodes for a given parent node ID
 * @param {array} nodes - Array of all nodes
 * @param {string} parentId - Parent node ID
 * @returns {array} Array of child nodes
 */
export const getChildNodes = (nodes, parentId) => {
  return nodes.filter(node => node.parentId === parentId);
};

/**
 * Check if a node can be a parent (not already a child and not itself)
 * @param {object} node - Node to check
 * @returns {boolean} True if node can be a parent
 */
export const canBeParent = (node) => {
  return !node.parentId; // A node that already has a parent cannot become a parent
};

/**
 * Check if attaching child to parent would create a circular dependency
 * @param {array} nodes - Array of all nodes
 * @param {string} childId - Child node ID
 * @param {string} parentId - Parent node ID
 * @returns {boolean} True if circular dependency would be created
 */
export const wouldCreateCircularDependency = (nodes, childId, parentId) => {
  if (childId === parentId) return true;
  
  // Check if the parent is a descendant of the child
  let currentParentId = parentId;
  const visited = new Set();
  
  while (currentParentId) {
    if (visited.has(currentParentId)) break; // Prevent infinite loop
    visited.add(currentParentId);
    
    if (currentParentId === childId) {
      return true; // Circular dependency detected
    }
    
    const parentNode = nodes.find(n => n.id === currentParentId);
    if (!parentNode || !parentNode.parentId) break;
    
    currentParentId = parentNode.parentId;
  }
  
  return false;
};

/**
 * Get all descendant node IDs (children and their children)
 * @param {array} nodes - Array of all nodes
 * @param {string} parentId - Parent node ID
 * @returns {Set} Set of descendant node IDs
 */
export const getDescendantIds = (nodes, parentId) => {
  const descendants = new Set();
  const queue = [parentId];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = nodes.filter(n => n.parentId === currentId);
    
    children.forEach(child => {
      descendants.add(child.id);
      queue.push(child.id);
    });
  }
  
  return descendants;
};
 