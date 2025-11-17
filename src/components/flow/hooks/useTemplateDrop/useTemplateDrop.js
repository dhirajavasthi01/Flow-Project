import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useAtomValue } from 'jotai';
import { templatesStateAtom } from '../../../../features/individualDetailWrapper/store/OverviewStore';

export const useTemplateDrop = () => {
  const templates = useAtomValue(templatesStateAtom);

  const handleTemplateDrop = useCallback((
    templateId,
    position,
    onNodesAdded,
    onEdgesAdded,
    dropCount = 1
  ) => {
    try {
      // Find the template
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        return {
          success: false,
          error: `Template with ID "${templateId}" not found`
        };
      }

      if (!template.nodes || template.nodes.length === 0) {
        return {
          success: false,
          error: 'Template has no nodes'
        };
      }

      // Calculate the offset from the original template position
      // Find the bounding box of the original template nodes
      const originalNodes = template.nodes;
      let minX = Infinity;
      let minY = Infinity;

      originalNodes.forEach(node => {
        if (node.position) {
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
        }
      });

      // If no valid positions found, use (0, 0) as default
      const originalTopLeft = {
        x: minX !== Infinity ? minX : 0,
        y: minY !== Infinity ? minY : 0
      };

      // Calculate offset to move template to drop position
      const offsetX = position.x - originalTopLeft.x;
      const offsetY = position.y - originalTopLeft.y;

      // Create a map for old node IDs to new node IDs
      const nodeIdMap = new Map();

      // Clone and transform nodes
      const newNodes = originalNodes.map(node => {
        const newId = nanoid();
        nodeIdMap.set(node.id, newId);

        return {
          ...node,
          id: newId,
          position: {
            x: (node.position?.x || 0) + offsetX,
            y: (node.position?.y || 0) + offsetY
          },
          // Update any data that might reference the old ID
          data: {
            ...node.data,
            // Add drop count to data if needed
            dropCount: dropCount
          }
        };
      });

      // Clone and transform edges
      const newEdges = (template.edges || []).map(edge => {
        const newSourceId = nodeIdMap.get(edge.source);
        const newTargetId = nodeIdMap.get(edge.target);

        // Only include edge if both source and target nodes exist
        if (!newSourceId || !newTargetId) {
          return null;
        }

        return {
          ...edge,
          id: nanoid(),
          source: newSourceId,
          target: newTargetId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        };
      }).filter(edge => edge !== null); // Remove any null edges

      // Call the callbacks to add nodes and edges
      if (onNodesAdded) {
        onNodesAdded(newNodes);
      }

      if (onEdgesAdded && newEdges.length > 0) {
        onEdgesAdded(newEdges);
      }

      return {
        success: true,
        nodes: newNodes,
        edges: newEdges,
        templateName: template.name
      };

    } catch (error) {
      console.error('Error dropping template:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while dropping template'
      };
    }
  }, [templates]);

  return {
    handleTemplateDrop
  };
};

