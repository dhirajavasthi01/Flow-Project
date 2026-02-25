import {
  extractDimensionsFromSvgByBBox,
  svgDimensionsCache,
} from '../../../../utills'
import { generateRandom8DigitNumber } from '../../../../utills/flowUtills/FlowUtills'
import { svgMap } from '../../components/svgMap/SvgMap'
import { syncNodeDimensions } from '../../hooks/useNodeResize/useNodeResize'

/**
 * Creates a node with dimensions from SVG or default dimensions
 * @param {Object} newNode - The new node data
 * @param {Function} setNodes - Function to update nodes state
 * @param {Function} setSelectedNodeId - Function to set selected node ID
 * @param {Function} setConfig - Function to set node config
 * @param {Function} setNewNode - Function to clear newNode atom
 * @param {Object} originalFetchedNodesRef - Ref to store original nodes for persistence
 * @param {Object} syncedNodeIdsRef - Ref to track synced node IDs
 */
export const createNodeWithSvgDimensions = async (
  newNode,
  setNodes,
  setSelectedNodeId,
  setConfig,
  setNewNode,
  originalFetchedNodesRef,
  syncedNodeIdsRef,
  nodes,
) => {
  const newId = `${newNode.nodeType}-${generateRandom8DigitNumber()}`
  const svgPath =
    newNode.svgPath || (newNode.nodeType ? svgMap[newNode.nodeType] : null)

  // Function to create node with dimensions
  // setupSvgViewBox is ONLY called here when dragging from node list
  // After creation, user can resize manually - parent-child relationships are preserved
  const createNodeWithDimensions = (dimensions) => {
    const nodeToCreate = {
      ...newNode,
      id: newId,
      // CRITICAL: Ensure new node doesn't have parentId (new nodes from list are standalone)
      // This prevents affecting parent-child relationships
      parentId: undefined,
    }

    // If we have SVG dimensions from bounding box measurement, use them (multiplied by 10)
    // setupSvgViewBox was already called in extractDimensionsFromSvgByBBox
    // This ONLY happens when dragging from node list
    if (dimensions && dimensions.width && dimensions.height) {
      // Multiply dimensions by 10 as requested
      const scaledWidth = dimensions.width * 10
      const scaledHeight = dimensions.height * 10

      nodeToCreate.width = scaledWidth
      nodeToCreate.height = scaledHeight
      nodeToCreate.style = {
        ...newNode.style,
        width: scaledWidth,
        height: scaledHeight,
      }
      nodeToCreate.data = {
        ...newNode.data,
        width: scaledWidth,
        height: scaledHeight,
      }
    } else {
      // No SVG dimensions available - use a consistent default size
      // This ensures all new nodes get the same default size if SVG dimensions aren't available
      // Using 250x250 as a reasonable default (same as syncNodeDimensions fallback)
      const defaultWidth = 250
      const defaultHeight = 250

      nodeToCreate.width = defaultWidth
      nodeToCreate.height = defaultHeight
      nodeToCreate.style = {
        ...newNode.style,
        width: defaultWidth,
        height: defaultHeight,
      }
      nodeToCreate.data = {
        ...newNode.data,
        width: defaultWidth,
        height: defaultHeight,
      }
    }

    const newNodeWithDimensions = syncNodeDimensions(nodeToCreate)

    // Mark as synced to prevent re-syncing in the other useEffect
    syncedNodeIdsRef.current.add(newId)

    // CRITICAL: Add new node to originalFetchedNodesRef immediately so dimensions can be persisted
    // This ensures the node exists in originalFetchedNodesRef when it's resized or deselected
    if (!originalFetchedNodesRef.current.find((n) => n.id === newId)) {
      originalFetchedNodesRef.current.push(newNodeWithDimensions)
    }

    setNodes([...nodes, newNodeWithDimensions])
    setSelectedNodeId(newId)
    setConfig({ ...newNode, id: newId })
    setNewNode(null)
  }

  // Try to get SVG dimensions by measuring bounding box (from cache or load them)
  // setupSvgViewBox is called inside extractDimensionsFromSvgByBBox
  // This ONLY happens when dragging from node list
  if (svgPath) {
    if (svgDimensionsCache.has(svgPath)) {
      // Use cached dimensions immediately
      const dimensions = svgDimensionsCache.get(svgPath)
      createNodeWithDimensions(dimensions)
    } else {
      // Load SVG dimensions by measuring bounding box, then create node
      // setupSvgViewBox is called here to set viewBox on the SVG
      try {
        const dimensions = await extractDimensionsFromSvgByBBox(svgPath)
        createNodeWithDimensions(dimensions)
      } catch (error) {
        // If loading fails, create node with defaults (will use measured dimensions)
        createNodeWithDimensions(null)
      }
    }
  } else {
    // No SVG path, create node with defaults (will use measured dimensions)
    createNodeWithDimensions(null)
  }
}
