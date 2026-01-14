
import {
  shouldNodeBlink,
  hasSubComponentAssetIdMatch,
} from "../../utills/flowUtills/FlowUtills";

const HIGHLIGHT_COLOR = "#E35205";

/**
 * Restores original color properties from original node data
 * @param {Object} nodeData - Current node data
 * @param {Object} originalNodeData - Original node data to restore from
 * @returns {Object} Updated node data with restored colors
 */
export const restoreOriginalColors = (nodeData, originalNodeData) => {
  if (!originalNodeData) {
    // Fallback: remove highlighting colors if original data is missing
    if (nodeData.nodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.nodeColor;
    }

    if (
      nodeData.gradientStart === HIGHLIGHT_COLOR &&
      nodeData.gradientEnd === HIGHLIGHT_COLOR
    ) {
      delete nodeData.gradientStart;
      delete nodeData.gradientEnd;
    }

    if (nodeData.specialNodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.specialNodeColor;
    }

    return nodeData;
  }

  // Restore original gradients if they existed
  if (
    originalNodeData.gradientStart !== undefined ||
    originalNodeData.gradientEnd !== undefined
  ) {
    nodeData.gradientStart = originalNodeData.gradientStart;
    nodeData.gradientEnd = originalNodeData.gradientEnd;

    // Remove highlighting nodeColor if restoring gradients
    if (nodeData.nodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.nodeColor;
    }

    // Remove highlighting specialNodeColor if restoring gradients
    if (nodeData.specialNodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.specialNodeColor;
    }

    return nodeData;
  }

  // Restore original specialNodeColor if it existed and wasn't the highlight color
  if (
    originalNodeData.specialNodeColor !== undefined &&
    originalNodeData.specialNodeColor !== HIGHLIGHT_COLOR
  ) {
    nodeData.specialNodeColor = originalNodeData.specialNodeColor;
    // Remove highlighting nodeColor if restoring specialNodeColor
    if (nodeData.nodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.nodeColor;
    }
    return nodeData;
  }

  // Restore original nodeColor if it existed and wasn't the highlight color
  if (
    originalNodeData.nodeColor !== undefined &&
    originalNodeData.nodeColor !== HIGHLIGHT_COLOR
  ) {
    nodeData.nodeColor = originalNodeData.nodeColor;
    // Remove highlighting specialNodeColor if restoring nodeColor
    if (nodeData.specialNodeColor === HIGHLIGHT_COLOR) {
      delete nodeData.specialNodeColor;
    }
    return nodeData;
  }

  // Remove highlight color if original didn't have nodeColor
  if (nodeData.nodeColor === HIGHLIGHT_COLOR) {
    delete nodeData.nodeColor;
  }

  // Remove highlight color if original didn't have specialNodeColor
  if (nodeData.specialNodeColor === HIGHLIGHT_COLOR) {
    delete nodeData.specialNodeColor;
  }

  return nodeData;
};

/**
 * Applies highlighting to a node based on matching tableData entries
 * @param {Object} nodeData - Node data to update
 * @param {Array} matchingTableDataEntries - Matching tableData entries
 * @param {number} actualTime - Current time for blink calculation
 * @returns {Object} Updated node data
 */
export const applyHighlighting = (
  nodeData,
  matchingTableDataEntries,
  actualTime
) => {
  let shouldBlink = false;

  // Check if any entry should blink within the last 24 hours
  for (const entry of matchingTableDataEntries) {
    if (entry.activeSince) {
      const { shouldBlink: blink } = shouldNodeBlink(
        actualTime,
        entry.activeSince,
        24
      );

      if (blink) {
        shouldBlink = true;
        break;
      }
    }
  }

  // Apply highlight color
  if (nodeData.gradientStart || nodeData.gradientEnd) {
    nodeData.gradientStart = HIGHLIGHT_COLOR;
    nodeData.gradientEnd = HIGHLIGHT_COLOR;
  } else if (nodeData.isSpecialNode) {
    nodeData.specialNodeColor = HIGHLIGHT_COLOR;
  } else {
    nodeData.nodeColor = HIGHLIGHT_COLOR;
  }

  // Collect unique failure mode names
  const failureModeNames = Array.from(
    new Set(
      matchingTableDataEntries
        .map(
          entry => entry.failureModeName ?? entry.activeFailureMode
        )
        .filter(Boolean)
    )
  );

  // Calculate minimum TTF days
  const daysArr = matchingTableDataEntries
    .map(item => item.forecastDays)
    .filter(item => item !== undefined && item !== null);

  const ttfDays = daysArr.length > 0 ? Math.min(...daysArr) : null;

  nodeData.ttfDays = ttfDays;
  nodeData.failureModeNames = failureModeNames;
  nodeData.shouldBlink = shouldBlink;

  console.log("nodeData ==========>", nodeData);

  return nodeData;
};

/**
 * Processes a single node based on tableData matching
 */
export const processSingleNode = (
  node,
  index,
  originalNodes,
  tableData,
  actualTime
) => {
  const originalNode =
    originalNodes[index] ||
    originalNodes.find(n => n.id === node.id);

  const nodeData = { ...node.data };
  const subComponentAssetId = nodeData?.subComponentAssetId;

  // Handle nodes without subComponentAssetId
  if (!subComponentAssetId) {
    const restoredData = restoreOriginalColors(
      nodeData,
      originalNode?.data
    );

    delete restoredData.failureModeNames;
    delete restoredData.shouldBlink;
    delete restoredData.ttfDays;

    return { ...node, data: restoredData };
  }

  // Find matching table data entries
  const matchingTableDataEntries = tableData.filter(item =>
    hasSubComponentAssetIdMatch(
      subComponentAssetId,
      item.subComponentAssetId
    )
  );

  if (matchingTableDataEntries.length > 0) {
    applyHighlighting(nodeData, matchingTableDataEntries, actualTime);
  } else {
    const restoredData = restoreOriginalColors(
      nodeData,
      originalNode?.data
    );

    delete restoredData.failureModeNames;
    delete restoredData.shouldBlink;
    delete restoredData.ttfDays;

    Object.assign(nodeData, restoredData);
  }

  return { ...node, data: nodeData };
};

/**
 * Processes nodes with tableData when not in developer mode
 */
export const processNodesWithTableData = (
  nodesToProcess,
  originalNodesForReset,
  tableData,
  isDeveloperMode,
  actualTime
) => {
  if (isDeveloperMode) {
    return nodesToProcess;
  }

  const originalNodes = originalNodesForReset || nodesToProcess;

  // Reset all nodes if no tableData
  if (!tableData || tableData.length === 0) {
    return nodesToProcess.map((node, index) => {
      const originalNode =
        originalNodes[index] ||
        originalNodes.find(n => n.id === node.id);

      const nodeData = { ...node.data };
      const restoredData = restoreOriginalColors(
        nodeData,
        originalNode?.data
      );

      delete restoredData.failureModeNames;
      delete restoredData.shouldBlink;
      delete restoredData.ttfDays;

      return { ...node, data: restoredData };
    });
  }

  return nodesToProcess.map((node, index) =>
    processSingleNode(
      node,
      index,
      originalNodes,
      tableData,
      actualTime
    )
  );
};

/**
 * Creates a key from tableData for change detection
 */
export const createTableDataKey = tableData => {
  if (!tableData || tableData.length === 0) {
    return "EMPTY_TABLEDATA";
  }

  return JSON.stringify(
    tableData.map(item => ({
      subComponentAssetId: item.subComponentAssetId,
      failureModeName:
        item.failureModeName ?? item.activeFailureMode,
      activeSince: item.activeSince,
    }))
  );
};

/**
 * Updates color properties in node data
 */
const updateColorProperties = (updatedData, processedData) => {
  if (processedData.gradientStart || processedData.gradientEnd) {
    updatedData.gradientStart = processedData.gradientStart;
    updatedData.gradientEnd = processedData.gradientEnd;
    delete updatedData.nodeColor;
    delete updatedData.specialNodeColor;
    return updatedData;
  }

  if (processedData.specialNodeColor !== undefined) {
    updatedData.specialNodeColor = processedData.specialNodeColor;
    delete updatedData.nodeColor;
    delete updatedData.gradientStart;
    delete updatedData.gradientEnd;
    return updatedData;
  }

  if (processedData.nodeColor !== undefined) {
    updatedData.nodeColor = processedData.nodeColor;
    delete updatedData.specialNodeColor;
    delete updatedData.gradientStart;
    delete updatedData.gradientEnd;
    return updatedData;
  }

  delete updatedData.nodeColor;
  delete updatedData.specialNodeColor;
  delete updatedData.gradientStart;
  delete updatedData.gradientEnd;

  return updatedData;
};

/**
 * Updates highlighting-related properties
 */
const updateHighlightingProperties = (updatedData, processedData) => {
  if (processedData.failureModeNames !== undefined) {
    updatedData.failureModeNames = processedData.failureModeNames;
  } else {
    delete updatedData.failureModeNames;
  }

  if (processedData.shouldBlink !== undefined) {
    updatedData.shouldBlink = processedData.shouldBlink;
  } else {
    delete updatedData.shouldBlink;
  }

  if (processedData.ttfDays !== undefined) {
    updatedData.ttfDays = processedData.ttfDays;
  } else {
    delete updatedData.ttfDays;
  }

  return updatedData;
};

/**
 * Merges processed nodes with current nodes
 */
export const mergeProcessedNodesWithCurrent = (
  processedNodes,
  currentNodes
) => {
  if (currentNodes.length === 0) {
    return processedNodes;
  }

  const currentNodeMap = new Map(
    currentNodes.map(node => [node.id, node])
  );

  return processedNodes.map(processedNode => {
    const currentNode = currentNodeMap.get(processedNode.id);

    if (!currentNode) {
      return processedNode;
    }

    const updatedData = { ...currentNode.data };

    updateColorProperties(updatedData, processedNode.data);
    updateHighlightingProperties(updatedData, processedNode.data);

    return {
      ...currentNode,
      style: currentNode.style,
      position: currentNode.position,
      positionAbsolute: currentNode.positionAbsolute,
      measured: currentNode.measured,
      data: updatedData,
    };
  });
};
