import { useEffect, useRef, useCallback } from "react";
import {
  processNodesWithTableData as processNodesWithTableDataUtil,
  mergeProcessedNodesWithCurrent,
  createTableDataKey,
} from "../../Flow.functions";

// --- Pure helpers (reduce complexity, no hook deps) ---

function cloneNodeForOriginal(node) {
  return {
    ...node,
    data: { ...node.data },
    style: node.style ? { ...node.style } : undefined,
  };
}

function syncOriginalFetchedNodesRef(originalRef, fetchedNodes) {
  const currentOriginalIds = originalRef.current
    .map((n) => n.id)
    .sort()
    .join(",");
  const fetchedIds = fetchedNodes
    .map((n) => n.id)
    .sort()
    .join(",");
  const shouldUpdate =
    originalRef.current.length === 0 || currentOriginalIds !== fetchedIds;
  if (shouldUpdate) {
    originalRef.current = fetchedNodes.map(cloneNodeForOriginal);
  }
}

function getProcessedNodes(processRef, sourceNodes) {
  const process = processRef.current;
  return process ? process(sourceNodes, sourceNodes) : sourceNodes;
}

function applyInitialLoadNormal({
  processRef,
  fetchedNodes,
  fetchedEdges,
  processEdges,
  setNodes,
  setEdges,
  zoomTo,
  fitView,
}) {
  const processedNodes = getProcessedNodes(processRef, fetchedNodes);
  const processedEdges = processEdges(fetchedEdges);
  setNodes(processedNodes);
  setEdges(processedEdges);
  setTimeout(() => {
    zoomTo(0.5);
    fitView({ duration: 800 });
  }, 100);
}

function applyInitialLoadDeveloper(
  fetchedNodes,
  fetchedEdges,
  processEdges,
  setNodes,
  setEdges,
) {
  setNodes(fetchedNodes);
  setEdges(processEdges(fetchedEdges));
}

function restoreCurrentNodesWithOriginalData(currentNodes, originalNodes) {
  if (currentNodes.length === 0) return originalNodes;
  const originalNodeMap = new Map(originalNodes.map((node) => [node.id, node]));
  return currentNodes.map((currentNode) => {
    const originalNode = originalNodeMap.get(currentNode.id);
    if (originalNode) {
      return { ...currentNode, data: originalNode.data };
    }
    return currentNode;
  });
}

function applyTableDataReprocess(
  originalRef,
  processRef,
  lastProcessedRef,
  tableData,
  setNodes,
) {
  const tableDataKey = createTableDataKey(tableData);
  if (lastProcessedRef.current === tableDataKey) return;
  lastProcessedRef.current = tableDataKey;

  setNodes((currentNodes) => {
    const processedNodes = getProcessedNodes(processRef, originalRef.current);
    return mergeProcessedNodesWithCurrent(processedNodes, currentNodes);
  });
}

function applyDeveloperModeRestore(originalRef, lastProcessedRef, setNodes) {
  const wasInDeveloperMode = lastProcessedRef.current === "DEVELOPER_MODE";
  if (wasInDeveloperMode) return;
  lastProcessedRef.current = "DEVELOPER_MODE";
  setNodes((currentNodes) =>
    restoreCurrentNodesWithOriginalData(currentNodes, originalRef.current),
  );
}

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
  zoomTo,
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
        actualTime,
      );
    },
    [tableData, isDeveloperMode, actualTime],
  );

  useEffect(() => {
    processNodesWithTableDataRef.current = processNodesWithTableData;
  }, [processNodesWithTableData]);

  const processEdges = useCallback((edgesToProcess) => {
    return edgesToProcess.map((edge) => ({
      ...edge,
      style: {
        stroke: "#000000",
        ...edge.style,
        strokeWidth: edge.style?.strokeWidth || 5,
      },
    }));
  }, []);

  // Initial load effect
  useEffect(() => {
    const hasData = fetchedNodes.length > 0 && !loadingFlow;
    if (hasData) {
      syncOriginalFetchedNodesRef(originalFetchedNodesRef, fetchedNodes);
      if (!isDeveloperMode) {
        applyInitialLoadNormal({
          processRef: processNodesWithTableDataRef,
          fetchedNodes,
          fetchedEdges,
          processEdges,
          setNodes,
          setEdges,
          zoomTo,
          fitView,
        });
      } else {
        applyInitialLoadDeveloper(
          fetchedNodes,
          fetchedEdges,
          processEdges,
          setNodes,
          setEdges,
        );
      }
      return;
    }
    if (error) {
      console.error("Error loading flow data:", error);
      setNodes([]);
      setEdges([]);
    }
  }, [
    fetchedNodes,
    fetchedEdges,
    loadingFlow,
    error,
    saved,
    fitView,
    zoomTo,
    isDeveloperMode,
    processEdges,
    setNodes,
    setEdges,
  ]);

  // Reprocess nodes when tableData changes or developer mode is toggled
  useEffect(() => {
    const hasOriginals = originalFetchedNodesRef.current.length > 0;
    if (!hasOriginals) return;

    if (!isDeveloperMode) {
      applyTableDataReprocess(
        originalFetchedNodesRef,
        processNodesWithTableDataRef,
        lastProcessedTableDataRef,
        tableData,
        setNodes,
      );
    } else {
      applyDeveloperModeRestore(
        originalFetchedNodesRef,
        lastProcessedTableDataRef,
        setNodes,
      );
    }
  }, [tableData, isDeveloperMode, setNodes]);

  return {
    originalFetchedNodesRef,
    processNodesWithTableDataRef,
  };
}
