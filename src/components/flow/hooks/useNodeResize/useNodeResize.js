import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

//Applies resize changes to nodes
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

// Custom hook that provides resize handler for nodes
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