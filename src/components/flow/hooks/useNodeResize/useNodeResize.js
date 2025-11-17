import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

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

