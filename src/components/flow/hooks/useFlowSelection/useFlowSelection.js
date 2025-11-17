import { useMemo } from 'react';

export const useFlowSelection = (nodes, edges) => {
  const selected = useMemo(() => {
    const selectedNodes = (nodes || []).filter(n => n.selected);
    const selectedEdges = (edges || []).filter(e => e.selected);

    const nodeIdSet = new Set(selectedNodes.map(n => n.id));
    const connectedEdges = (edges || []).filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target));
    const allEdges = Array.from(new Set([...selectedEdges, ...connectedEdges]));

    return { selectedNodes, selectedEdges, connectedEdges, allEdges };
  }, [nodes, edges]);

  return selected;
};


