import { useEffect, useRef, useCallback } from 'react';
import {
  processNodesWithTableData as processNodesWithTableDataUtil,
  mergeProcessedNodesWithCurrent,
  createTableDataKey
} from '../../Flow.functions';

/**
 * Custom hook for managing node processing and data synchronization
 */
export function useNodeProcessing({
  fetchedNodes,
  fetchedEdges,
  loadingFlow,
  error,
  saved,
  isDeveloperMode,
  tableData,
  actualTime,
  setNodes,
  setEdges,
  fitView,
  zoomTo
}) {
  const originalFetchedNodesRef = useRef([]);
  const lastProcessedTableDataRef = useRef(null);
  const processNodesWithTableDataRef = useRef(null);

  const processNodesWithTableData = useCallback(
    (nodesToProcess, originalNodesForReset = null) => {
      return processNodesWithTableDataUtil(
        nodesToProcess,
        originalNodesForReset,
        tableData,
        isDeveloperMode,
        actualTime
      );
    },
    [tableData, isDeveloperMode, actualTime]
  );

  useEffect(() => {
    processNodesWithTableDataRef.current = processNodesWithTableData;
  }, [processNodesWithTableData]);

  // Process edges with default styles
  const processEdges = useCallback((edgesToProcess) => {
    return edgesToProcess.map(edge => ({
      ...edge,
      style: {
        stroke: '#000000',
        ...edge.style,
        strokeWidth: edge.style?.strokeWidth || 5
      }
    }));
  }, []);

  // Initial load effect
  useEffect(() => {
    if (fetchedNodes.length > 0 && !loadingFlow) {
      const currentOriginalIds = originalFetchedNodesRef.current.map(n => n.id).sort().join(',');
      const fetchedIds = fetchedNodes.map(n => n.id).sort().join(',');
      
      if (originalFetchedNodesRef.current.length === 0 || currentOriginalIds !== fetchedIds) {
        originalFetchedNodesRef.current = fetchedNodes.map(node => ({
          ...node,
          data: { ...node.data },
          style: node.style ? { ...node.style } : undefined
        }));
      }

      if (!isDeveloperMode) {
        const processedNodes = processNodesWithTableDataRef.current
          ? processNodesWithTableDataRef.current(fetchedNodes, fetchedNodes)
          : fetchedNodes;
        const processedEdges = processEdges(fetchedEdges);
        setNodes(processedNodes);
        setEdges(processedEdges);

        setTimeout(() => {
          zoomTo(0.5);
          fitView({ duration: 800 });
        }, 100);
      } else {
        setNodes(fetchedNodes);
        const processedEdges = processEdges(fetchedEdges);
        setEdges(processedEdges);
      }
    } else if (error) {
      setNodes([]);
      setEdges([]);
    }
  }, [fetchedNodes, fetchedEdges, loadingFlow, error, saved, fitView, zoomTo, isDeveloperMode, processEdges, setNodes, setEdges]);

  // Reprocess nodes when tableData changes or developer mode is toggled
  useEffect(() => {
    if (originalFetchedNodesRef.current.length > 0 && !isDeveloperMode) {
      const tableDataKey = createTableDataKey(tableData);
      
      if (lastProcessedTableDataRef.current === tableDataKey) {
        return;
      }
      lastProcessedTableDataRef.current = tableDataKey;

      setNodes((currentNodes) => {
        const processedNodes = processNodesWithTableDataRef.current
          ? processNodesWithTableDataRef.current(originalFetchedNodesRef.current, originalFetchedNodesRef.current)
          : originalFetchedNodesRef.current;

        return mergeProcessedNodesWithCurrent(processedNodes, currentNodes);
      });
    } else if (originalFetchedNodesRef.current.length > 0 && isDeveloperMode) {
      const wasInDeveloperMode = lastProcessedTableDataRef.current === 'DEVELOPER_MODE';
      if (!wasInDeveloperMode) {
        lastProcessedTableDataRef.current = 'DEVELOPER_MODE';
        setNodes((currentNodes) => {
          if (currentNodes.length > 0) {
            const originalNodeMap = new Map(originalFetchedNodesRef.current.map(node => [node.id, node]));
            return currentNodes.map(currentNode => {
              const originalNode = originalNodeMap.get(currentNode.id);
              if (originalNode) {
                return {
                  ...currentNode,
                  data: originalNode.data
                };
              }
              return currentNode;
            });
          }
          return originalFetchedNodesRef.current;
        });
      }
    }
  }, [tableData, isDeveloperMode, setNodes]);

  return {
    originalFetchedNodesRef,
    processNodesWithTableDataRef
  };
}
 