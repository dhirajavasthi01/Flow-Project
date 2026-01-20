import { useCallback, useEffect, useRef } from "react";
import {
  takeSnapshot as takeSnapshotHelper,
  undo as undoHelper,
  handleKeyPress as handleKeyPressHelper,
  applySnappingToChanges as applySnappingToChangesHelper,
} from "../../snapshotHelper";

/**
 * Custom hook for managing flow snapshots, undo/redo, keyboard shortcuts, and snapping
 * @param {Object} params - Hook parameters
 * @param {Array} params.nodes - Current nodes array
 * @param {Array} params.edges - Current edges array
 * @param {Function} params.setNodes - Function to update nodes
 * @param {Function} params.setEdges - Function to update edges
 * @param {Function} params.setSelectedNodeId - Function to set selected node ID
 * @param {Function} params.setSelectedEdgeId - Function to set selected edge ID
 * @param {Function} params.setConfig - Function to set config
 * @param {Function} params.checkIsDotNode - Function to check if node is a dot node
 * @param {Function} params.snapNodePosition - Function to snap node position
 * @param {Object} params.config - Current config
 * @param {string} params.selectedNodeId - Selected node ID
 * @param {Object} params.nodeToCopy - Node to copy
 * @param {Function} params.setNewNode - Function to set new node
 * @param {Function} params.setNodeToCopy - Function to set node to copy
 * @param {Function} params.setShouldDelete - Function to trigger delete
 * @returns {Object} Object containing takeSnapshot, undo, applySnappingToChanges functions
 */
export const useFlowSnapshot = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  setSelectedNodeId,
  setSelectedEdgeId,
  setConfig,
  checkIsDotNode,
  snapNodePosition,
  config,
  selectedNodeId,
  nodeToCopy,
  setNewNode,
  setNodeToCopy,
  setShouldDelete,
}) => {
  const historyRef = useRef([]);
  const isUndoingRef = useRef(false);

  // Take snapshot function
  const takeSnapshot = useCallback(() => {
    takeSnapshotHelper(nodes, edges, historyRef, isUndoingRef);
  }, [nodes, edges]);

  // Undo function
  const undo = useCallback(() => {
    undoHelper(
      historyRef,
      isUndoingRef,
      setNodes,
      setEdges,
      setSelectedNodeId,
      setSelectedEdgeId,
      setConfig
    );
  }, [setNodes, setEdges, setSelectedNodeId, setSelectedEdgeId, setConfig]);

  // Apply snapping to changes function
  const applySnappingToChanges = useCallback(
    (changes, dragEndNodeId) => {
      return applySnappingToChangesHelper(
        changes,
        dragEndNodeId,
        checkIsDotNode,
        snapNodePosition
      );
    },
    [checkIsDotNode, snapNodePosition]
  );

  // Keyboard handler effect
  useEffect(() => {
    const handleKeyPressWrapper = (e) => {
      handleKeyPressHelper(
        e,
        undo,
        takeSnapshot,
        nodeToCopy,
        setNewNode,
        setNodeToCopy,
        config,
        selectedNodeId,
        setShouldDelete
      );
    };
    window.addEventListener("keydown", handleKeyPressWrapper);
    return () => {
      window.removeEventListener("keydown", handleKeyPressWrapper);
    };
  }, [
    config,
    nodeToCopy,
    selectedNodeId,
    undo,
    takeSnapshot,
    setNewNode,
    setNodeToCopy,
    setShouldDelete,
  ]);

  return {
    takeSnapshot,
    undo,
    applySnappingToChanges,
  };
};
