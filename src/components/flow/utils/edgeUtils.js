import { addEdge } from '@xyflow/react';

/**
 * Creates an edge based on the selected edge type
 */
export function createEdgeByType(selectedEdgeType, params) {
  const baseEdge = {
    ...params,
    style: { stroke: '#000000', strokeWidth: 5 }
  };

  switch (selectedEdgeType) {
    case 'straightArrow':
      return {
        ...baseEdge,
        type: 'flowingPipeStraightArrow',
        markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#000' }
      };

    case 'straight':
      return {
        ...baseEdge,
        type: 'flowingPipe'
      };

    case 'dotted':
      return {
        ...baseEdge,
        type: 'flowingPipeDotted'
      };

    case 'dottedArrow':
      return {
        ...baseEdge,
        type: 'flowingPipeDottedArrow',
        markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#000' }
      };

    default:
      return {
        ...baseEdge,
        type: 'flowingPipeStraightArrow',
        markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#000' }
      };
  }
}

/**
 * Creates onConnect handler for edge creation
 */
export function createOnConnectHandler(isDeveloperMode, selectedEdgeType, setEdges) {
  return (params) => {
    if (!isDeveloperMode) return;
    const newEdge = createEdgeByType(selectedEdgeType, params);
    setEdges((eds) => addEdge(newEdge, eds));
  };
}
