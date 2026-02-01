import { useCallback, useEffect, useRef } from "react";
import {
  takeSnapshot as takeSnapshotHelper,
  undo as undoHelper,
  handleKeyPress as handleKeyPressHelper,
  applySnappingToChanges as applySnappingToChangesHelper,
} from "../../utils/snapshotHelper/SnapshotHelper";

//Custom hook for managing flow snapshots, undo/redo, keyboard shortcuts, and snapping
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
 