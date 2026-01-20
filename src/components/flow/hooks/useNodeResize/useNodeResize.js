import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

/**
 * Applies resize changes to nodes
 * @param {Array} nodes - Current nodes array
 * @param {Array} changesWithSnapping - Array of changes with snapping applied
 * @returns {Array} Updated nodes array with resize changes applied
 */
export const applyResizeChanges = (nodes, changesWithSnapping) => {
  return nodes.map((node) => {
    const resizeChange = changesWithSnapping.find(
      (change) => change.type === "resize" && change.id === node.id
    );
    if (!resizeChange) return node;
    return {
      ...node,
      style: {
        ...node.style,
        width: resizeChange.dimensions.width,
        height: resizeChange.dimensions.height,
      },
      data: {
        ...node.data,
        width: resizeChange.dimensions.width,
        height: resizeChange.dimensions.height,
      },
    };
  });
};

/**
 * Custom hook that provides resize handler for nodes
 * @param {string} id - Node ID
 * @returns {function} onResizeEnd callback function
 */
export const useNodeResize = (id) => {
  const { setNodes } = useReactFlow();

  const onResizeEnd = useCallback(
    (_, params) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              style: { ...node.style, width: params.width, height: params.height },
            };
          }
          return node;
        })
      );
    },
    [id, setNodes]
  );

  return onResizeEnd;
};

