import { useCallback } from 'react';
import { useTemplateManager } from '../useTemplateManager/useTemplateManager';
import { generateRandom8DigitNumber } from '../../../../utills/flowUtills/FlowUtills';


export const useTemplateDrop = () => {
  const { getTemplate } = useTemplateManager();

  const cloneTemplate = useCallback((templateId, dropPosition, offset = { x: 20, y: 20 }) => {
    const template = getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const positions = (template.nodes || []).map(n => n.position || { x: 0, y: 0 });
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };

    const nodeIdMap = new Map();
    
    const clonedNodes = template.nodes.map(node => {
      const newId =`${node.nodeType}-${generateRandom8DigitNumber()}`;
      nodeIdMap.set(node.id, newId);
      
      const clonedNode = {
        ...node,
        id: newId,
        position: {
          x: (dropPosition?.x ?? 0) + (node.position.x - center.x) + (offset.x || 0),
          y: (dropPosition?.y ?? 0) + (node.position.y - center.y) + (offset.y || 0),
        },
        selected: false,
        dragging: false
      };
      
      return clonedNode;
    });

const clonedEdges = template.edges.map(edge => {
  const newSource = nodeIdMap.get(edge.source);
  const newTarget = nodeIdMap.get(edge.target);
  
  if (!newSource || !newTarget) {
    return null;
  }  

  const sourceHandleSuffix = edge.sourceHandle.replace(edge.source, '');
  const targetHandleSuffix = edge.targetHandle.replace(edge.target, '');
  
  const newSourceHandle = `${newSource}${sourceHandleSuffix}`;
  const newTargetHandle = `${newTarget}${targetHandleSuffix}`;
  
  const newEdgeId = `xy-edge__${newSource}${newSourceHandle}-${newTarget}${newTargetHandle}`;
  
  const clonedEdge = {
    ...edge,
    id: newEdgeId,
    source: newSource,
    target: newTarget,
    sourceHandle: newSourceHandle,
    targetHandle: newTargetHandle,
    selected: false
  };
 
  return clonedEdge;
}).filter(Boolean);
    return {
      nodes: clonedNodes,
      edges: clonedEdges
    };
  }, [getTemplate]);

  const calculateOffset = useCallback((dropCount = 0, baseOffset = { x: 20, y: 20 }) => {
    const multiplier = Math.floor(dropCount / 3) + 1;
    return {
      x: baseOffset.x * multiplier,
      y: baseOffset.y * multiplier
    };
  }, []);

  const handleTemplateDrop = useCallback((
    templateId, 
    dropPosition, 
    onNodesAdd, 
    onEdgesAdd, 
    dropCount = 0
  ) => {
    try {
      const offset = calculateOffset(dropCount);
      const { nodes, edges } = cloneTemplate(templateId, dropPosition, offset);
      
      onNodesAdd(nodes);
      onEdgesAdd(edges);
      
      return { success: true, nodes, edges };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [cloneTemplate, calculateOffset]);

  return {
    cloneTemplate,
    calculateOffset,
    handleTemplateDrop
  };
};