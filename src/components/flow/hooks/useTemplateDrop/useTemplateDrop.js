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

    // Separate parent nodes (nodes without parentId) from child nodes
    const parentNodes = (template.nodes || []).filter(n => !n.parentId);
    const childNodes = (template.nodes || []).filter(n => n.parentId);
    
    // Calculate center based only on parent nodes (child positions are relative to parent)
    const positions = parentNodes.map(n => n.position || { x: 0, y: 0 });
    const minX = positions.length > 0 ? Math.min(...positions.map(p => p.x)) : 0;
    const maxX = positions.length > 0 ? Math.max(...positions.map(p => p.x)) : 0;
    const minY = positions.length > 0 ? Math.min(...positions.map(p => p.y)) : 0;
    const maxY = positions.length > 0 ? Math.max(...positions.map(p => p.y)) : 0;
    const center = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };

    const nodeIdMap = new Map();
    
    // First pass: create all nodes with new IDs and build the ID mapping
    // Only update positions for parent nodes, keep child node positions unchanged
    const clonedNodes = template.nodes.map(node => {
      const newId =`${node.nodeType}-${generateRandom8DigitNumber()}`;
      nodeIdMap.set(node.id, newId);
      
      // If node is a child (has parentId), keep its position unchanged (relative to parent)
      // Only update position for parent nodes
      const isChildNode = !!node.parentId;
      const clonedNode = {
        ...node,
        id: newId,
        position: isChildNode 
          ? node.position // Keep child node position unchanged (relative to parent)
          : {
              // Update parent node position based on drop position
              x: (dropPosition?.x ?? 0) + (node.position.x - center.x) + (offset.x || 0),
              y: (dropPosition?.y ?? 0) + (node.position.y - center.y) + (offset.y || 0),
            },
        selected: false,
        dragging: false
      };
      
      return clonedNode;
    });
    
    // Second pass: update parentId references to use new node IDs
    // Also remove positionAbsolute as React Flow will recalculate it based on parentId and position
    const nodesWithUpdatedParentIds = clonedNodes.map(node => {
      const updatedNode = { ...node };
      
      // Remove positionAbsolute - React Flow will recalculate it automatically
      if (updatedNode.positionAbsolute) {
        delete updatedNode.positionAbsolute;
      }
      
      if (node.parentId) {
        const newParentId = nodeIdMap.get(node.parentId);
        if (newParentId) {
          updatedNode.parentId = newParentId;
        } else {
          // If parentId doesn't exist in the template, remove it (parent node not included in template)
          updatedNode.parentId = undefined;
        }
      }
      
      return updatedNode;
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
      nodes: nodesWithUpdatedParentIds,
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
      console.error('Error dropping template:', error);
      return { success: false, error: error.message };
    }
  }, [cloneTemplate, calculateOffset]);

  return {
    cloneTemplate,
    calculateOffset,
    handleTemplateDrop
  };
};