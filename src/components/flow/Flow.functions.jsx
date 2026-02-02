import {
  shouldNodeBlink,
  hasSubComponentAssetIdMatch,
} from "../../utills/flowUtills/FlowUtills";
const HIGHLIGHT_COLOR = "#E35205";

// Removes highlight color from a specific property if it exists
const removeHighlightColor = (nodeData, property) => {
  if (nodeData[property] === HIGHLIGHT_COLOR) {
    delete nodeData[property];
  }
};

//Removes all highlight colors from node data
const removeAllHighlightColors = (nodeData) => {
  removeHighlightColor(nodeData, 'nodeColor');
  removeHighlightColor(nodeData, 'specialNodeColor');
  if (nodeData.gradientStart === HIGHLIGHT_COLOR && nodeData.gradientEnd === HIGHLIGHT_COLOR) {
    delete nodeData.gradientStart;
    delete nodeData.gradientEnd;
  }
};

//Checks if a property exists in original data and is not the highlight color
const hasValidOriginalColor = (originalNodeData, property) => {
  return originalNodeData[property] !== undefined && 
         originalNodeData[property] !== HIGHLIGHT_COLOR;
};

// Checks if original data has gradient properties
const hasOriginalGradients = (originalNodeData) => {
  return originalNodeData.gradientStart !== undefined || 
         originalNodeData.gradientEnd !== undefined;
};

//S Restores original color properties from original node data
export const restoreOriginalColors = (nodeData, originalNodeData) => {
  // If no original data, just remove all highlight colors
  if (!originalNodeData) {
    removeAllHighlightColors(nodeData);
    return nodeData;
  }

  // Priority 1: Restore gradients if they existed
  if (hasOriginalGradients(originalNodeData)) {
    nodeData.gradientStart = originalNodeData.gradientStart;
    nodeData.gradientEnd = originalNodeData.gradientEnd;
    removeHighlightColor(nodeData, 'nodeColor');
    removeHighlightColor(nodeData, 'specialNodeColor');
    return nodeData;
  }

  // Priority 2: Restore specialNodeColor if it existed and wasn't highlight
  if (hasValidOriginalColor(originalNodeData, 'specialNodeColor')) {
    nodeData.specialNodeColor = originalNodeData.specialNodeColor;
    removeHighlightColor(nodeData, 'nodeColor');
    return nodeData;
  }

  // Priority 3: Restore nodeColor if it existed and wasn't highlight
  if (hasValidOriginalColor(originalNodeData, 'nodeColor')) {
    nodeData.nodeColor = originalNodeData.nodeColor;
    removeHighlightColor(nodeData, 'specialNodeColor');
    return nodeData;
  }

  // Fallback: Remove any remaining highlight colors
  removeAllHighlightColors(nodeData);
  return nodeData;
};
 
// Applies highlighting to a node based on matching tableData entries
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
  return nodeData;
};

export const processSingleNode = ( // Processes a single node based on tableData matching
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
    // Preserve all node properties including position, parentId, extent, etc.
    return { 
      ...node, 
      data: restoredData,
      // Explicitly preserve position and parent-child properties
      position: node.position,
      positionAbsolute: node.positionAbsolute,
      parentId: node.parentId,
      extent: node.extent
    };
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
  // Preserve all node properties including position, parentId, extent, etc.
  return { 
    ...node, 
    data: nodeData,
    // Explicitly preserve position and parent-child properties
    position: node.position,
    positionAbsolute: node.positionAbsolute,
    parentId: node.parentId,
    extent: node.extent
  };
};

export const processNodesWithTableData = ( // Processes nodes with tableData when not in developer mode
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
      // Preserve all node properties including position, parentId, extent, etc.
      return { 
        ...node, 
        data: restoredData,
        // Explicitly preserve position and parent-child properties
        position: node.position,
        positionAbsolute: node.positionAbsolute,
        parentId: node.parentId,
        extent: node.extent
      };
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

export const createTableDataKey = tableData => { //Creates a key from tableData for change detection
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

const updateColorProperties = (updatedData, processedData) => { // Updates color properties in node data
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

const updateHighlightingProperties = (updatedData, processedData) => { // Updates highlighting-related properties
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

export const mergeProcessedNodesWithCurrent = ( // Merges processed nodes with current nodes
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
      // Preserve all current node properties including dimensions
      width: currentNode.width,
      height: currentNode.height,
      style: currentNode.style,
      // CRITICAL: Always preserve position from current node to maintain correct positions
      position: currentNode.position,
      positionAbsolute: currentNode.positionAbsolute,
      measured: currentNode.measured,
      // CRITICAL: Preserve parent-child relationships from current node
      parentId: currentNode.parentId,
      extent: currentNode.extent,
      data: {
        ...updatedData,
        // Preserve isAttachedToGroup from current node
        isAttachedToGroup: currentNode.data?.isAttachedToGroup
      },
    };
  });
};