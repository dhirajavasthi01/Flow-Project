import { generateRandom8DigitNumber } from '../../../utills/flowUtills/FlowUtills';

/**
 * Utility functions for node resize operations
 */

export function applyResizeChanges(nodes, changesWithSnapping) {
  return nodes.map((node) => {
    const resizeChange = changesWithSnapping.find(
      (change) => change.type === 'resize' && change.id === node.id
    );

    if (!resizeChange) return node;

    return {
      ...node,
      style: {
        ...node.style,
        width: resizeChange.dimensions.width,
        height: resizeChange.dimensions.height
      },
      data: {
        ...node.data,
        width: resizeChange.dimensions.width,
        height: resizeChange.dimensions.height
      }
    };
  });
}

export function updateOriginalFetchedNodesRef(finalNodes, originalFetchedNodesRef) {
  originalFetchedNodesRef.current = finalNodes.map(node => {
    const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
    if (!originalNode) return node;

    return {
      ...originalNode,
      style: node.style,
      data: {
        ...originalNode.data,
        width: node.data.width,
        height: node.data.height
      }
    };
  });
}
