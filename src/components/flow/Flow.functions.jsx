import { shouldNodeBlink, hasSubComponentAssetIdMatch } from '../../utills/flowUtills/FlowUtills';

const HIGHLIGHT_COLOR = '#cc0000';

/**
 * Restores original color properties from original node data
 * @param {Object} nodeData - Current node data
 * @param {Object} originalNodeData - Original node data to restore from
 * @returns {Object} Updated node data with restored colors
 */
export const restoreOriginalColors = (nodeData, originalNodeData) => {
  if (!originalNodeData) {
    // Fallback: remove highlighting colors if we can't find original
    if (nodeData.nodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.nodeColor;
    }
    if (nodeData.gradientStart === HIGHLIGHT_COLOR && nodeData.gradientEnd === HIGHLIGHT_COLOR) {
      delete nodeData.gradientStart;
      delete nodeData.gradientEnd;
    }
    return nodeData;
  }

  // Restore original gradients if they existed
  if (originalNodeData.gradientStart !== undefined || originalNodeData.gradientEnd !== undefined) {
    nodeData.gradientStart = originalNodeData.gradientStart;
    nodeData.gradientEnd = originalNodeData.gradientEnd;
    // Remove highlighting nodeColor if restoring gradients
    if ('nodeColor' in nodeData && nodeData.nodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.nodeColor;
    }
    return nodeData;
  }

  // Restore original nodeColor if it existed and wasn't highlighting color
  if (originalNodeData.nodeColor !== undefined && originalNodeData.nodeColor !== HIGHLIGHT_COLOR) {
    nodeData.nodeColor = originalNodeData.nodeColor;
    return nodeData;
  }

  // Remove highlighting red color if original didn't have nodeColor
  if (nodeData.nodeColor === HIGHLIGHT_COLOR) {
    delete nodeData.nodeColor;
  }

  return nodeData;
};

/**
 * Applies highlighting (red color) to a node based on matching tableData entries
 * @param {Object} nodeData - Node data to update
 * @param {Array} matchingTableDataEntries - Matching tableData entries
 * @param {number} actualTime - Current time for blink calculation
 * @returns {Object} Updated node data with highlighting applied
 */
export const applyHighlighting = (nodeData, matchingTableDataEntries, actualTime) => {
  // Check if ANY activeSince is within last 24 hours
  let shouldBlink = false;
  for (const entry of matchingTableDataEntries) {
    if (entry.activeSince) {
      const blinkResult = shouldNodeBlink(actualTime, entry.activeSince, 24);
      if (blinkResult.shouldBlink) {
        shouldBlink = true;
        break;
      }
    }
  }

  // Apply red highlighting color
  if (nodeData.gradientStart || nodeData.gradientEnd) {
    nodeData.gradientStart = HIGHLIGHT_COLOR;
    nodeData.gradientEnd = HIGHLIGHT_COLOR;
  } else {
    nodeData.nodeColor = HIGHLIGHT_COLOR;
  }

  // Set failure mode names and blinking
  const failureModeNames = Array.from(
    new Set(
      matchingTableDataEntries
        .map(entry => entry.failureModeName ?? entry.activeFailureMode)
        .filter(Boolean)
    )
  );

  nodeData.failureModeNames = failureModeNames;
  nodeData.shouldBlink = shouldBlink;

  return nodeData;
};

/**
 * Processes a single node based on tableData matching
 * @param {Object} node - Node to process
 * @param {number} index - Index of node in array
 * @param {Array} originalNodes - Original nodes for color restoration
 * @param {Array} tableData - Table data for matching
 * @param {number} actualTime - Current time for blink calculation
 * @returns {Object} Processed node
 */
export const processSingleNode = (node, index, originalNodes, tableData, actualTime) => {
  const originalNode = originalNodes[index] || originalNodes.find(n => n.id === node.id);
  const nodeData = { ...node.data };
  const subComponentAssetId = node.data?.subComponentAssetId;

  // Handle nodes without subComponentAssetId
  if (!subComponentAssetId) {
    const restoredData = restoreOriginalColors(nodeData, originalNode?.data);
    delete restoredData.failureModeNames;
    delete restoredData.shouldBlink;
    return { ...node, data: restoredData };
  }

  // Find matching tableData entries
  const matchingTableDataEntries = tableData.filter(
    item => hasSubComponentAssetIdMatch(subComponentAssetId, item.subComponentAssetId)
  );

  if (matchingTableDataEntries.length > 0) {
    // Apply highlighting
    applyHighlighting(nodeData, matchingTableDataEntries, actualTime);
  } else {
    // Reset to original colors
    const restoredData = restoreOriginalColors(nodeData, originalNode?.data);
    delete restoredData.failureModeNames;
    delete restoredData.shouldBlink;
    Object.assign(nodeData, restoredData);
  }

  return { ...node, data: nodeData };
};

/**
 * Processes nodes to match with tableData when not in developer mode
 * @param {Array} nodesToProcess - Nodes to process
 * @param {Array} originalNodesForReset - Original nodes for color restoration
 * @param {Array} tableData - Table data for matching
 * @param {boolean} isDeveloperMode - Whether in developer mode
 * @param {number} actualTime - Current time for blink calculation
 * @returns {Array} Processed nodes
 */
export const processNodesWithTableData = (
  nodesToProcess,
  originalNodesForReset,
  tableData,
  isDeveloperMode,
  actualTime
) => {
  // Return nodes as-is in developer mode
  if (isDeveloperMode) {
    return nodesToProcess;
  }

  // Use original nodes for reset if provided, otherwise use nodesToProcess
  const originalNodes = originalNodesForReset || nodesToProcess;

  // If no tableData, reset all nodes to original state
  if (!tableData || tableData.length === 0) {
    return nodesToProcess.map((node, index) => {
      const originalNode = originalNodes[index] || originalNodes.find(n => n.id === node.id);
      const nodeData = { ...node.data };
      const restoredData = restoreOriginalColors(nodeData, originalNode?.data);
      delete restoredData.failureModeNames;
      delete restoredData.shouldBlink;
      return { ...node, data: restoredData };
    });
  }

  // Process each node
  return nodesToProcess.map((node, index) =>
    processSingleNode(node, index, originalNodes, tableData, actualTime)
  );
};

/**
 * Creates a key from tableData for change detection
 * @param {Array} tableData - Table data
 * @returns {string} Key string for comparison
 */
export const createTableDataKey = (tableData) => {
  if (!tableData || tableData.length === 0) {
    return 'EMPTY_TABLEDATA';
  }

  return JSON.stringify(
    tableData.map(item => ({
      subComponentAssetId: item.subComponentAssetId,
      failureModeName: item.failureModeName ?? item.activeFailureMode,
      activeSince: item.activeSince
    }))
  );
};

/**
 * Updates color properties in node data based on processed node
 * @param {Object} updatedData - Current node data to update
 * @param {Object} processedData - Processed node data
 * @returns {Object} Updated data with color properties set
 */
const updateColorProperties = (updatedData, processedData) => {
  if (processedData.gradientStart || processedData.gradientEnd) {
    updatedData.gradientStart = processedData.gradientStart;
    updatedData.gradientEnd = processedData.gradientEnd;
    if ('nodeColor' in updatedData) {
      delete updatedData.nodeColor;
    }
    return updatedData;
  }

  if (processedData.nodeColor !== undefined) {
    updatedData.nodeColor = processedData.nodeColor;
    if ('gradientStart' in updatedData) {
      delete updatedData.gradientStart;
    }
    if ('gradientEnd' in updatedData) {
      delete updatedData.gradientEnd;
    }
    return updatedData;
  }

  // Remove all color properties if node doesn't match
  if ('nodeColor' in updatedData) {
    delete updatedData.nodeColor;
  }
  if ('gradientStart' in updatedData) {
    delete updatedData.gradientStart;
  }
  if ('gradientEnd' in updatedData) {
    delete updatedData.gradientEnd;
  }

  return updatedData;
};

/**
 * Updates highlighting properties in node data
 * @param {Object} updatedData - Current node data to update
 * @param {Object} processedData - Processed node data
 * @returns {Object} Updated data with highlighting properties set
 */
const updateHighlightingProperties = (updatedData, processedData) => {
  if (processedData.failureModeNames !== undefined) {
    updatedData.failureModeNames = processedData.failureModeNames;
  } else if ('failureModeNames' in updatedData) {
    delete updatedData.failureModeNames;
  }

  if (processedData.shouldBlink !== undefined) {
    updatedData.shouldBlink = processedData.shouldBlink;
  } else if ('shouldBlink' in updatedData) {
    delete updatedData.shouldBlink;
  }

  return updatedData;
};

/**
 * Merges processed nodes with current nodes, preserving current state
 * @param {Array} processedNodes - Nodes processed from original data
 * @param {Array} currentNodes - Current nodes with user modifications
 * @returns {Array} Merged nodes
 */
export const mergeProcessedNodesWithCurrent = (processedNodes, currentNodes) => {
  if (currentNodes.length === 0) {
    return processedNodes;
  }

  const currentNodeMap = new Map(currentNodes.map(node => [node.id, node]));

  return processedNodes.map(processedNode => {
    const currentNode = currentNodeMap.get(processedNode.id);
    if (!currentNode) {
      return processedNode;
    }

    // Preserve ALL current state but update highlighting properties
    const updatedData = { ...currentNode.data };

    // Update color and highlighting properties
    updateColorProperties(updatedData, processedNode.data);
    updateHighlightingProperties(updatedData, processedNode.data);

    return {
      ...currentNode,
      style: currentNode.style,
      position: currentNode.position,
      positionAbsolute: currentNode.positionAbsolute,
      measured: currentNode.measured,
      data: updatedData
    };
  });
};

