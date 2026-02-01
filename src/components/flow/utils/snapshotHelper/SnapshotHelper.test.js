import {
  takeSnapshot,
  undo,
  handleKeyPress,
  shouldApplySnapping,
  isValidSnapDistance,
  applySnappingToChange,
  applySnappingToChanges,
} from "./SnapshotHelper.js";

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("History & Undo Utilities", () => {
  let historyRef;
  let isUndoingRef;

  beforeEach(() => {
    historyRef = { current: [] };
    isUndoingRef = { current: false };
  });

  // ================= takeSnapshot =================

  it("should add a snapshot to history", () => {
    const nodes = [{ id: "1", selected: true, data: {}, style: {} }];
    const edges = [{ id: "e1", selected: true, style: {} }];

    takeSnapshot(nodes, edges, historyRef, isUndoingRef);

    expect(historyRef.current.length).toBe(1);
    expect(historyRef.current[0].nodes[0].selected).toBe(false);
    expect(historyRef.current[0].edges[0].selected).toBe(false);
  });

  it("should not add snapshot when undoing", () => {
    isUndoingRef.current = true;
    takeSnapshot([], [], historyRef, isUndoingRef);
    expect(historyRef.current.length).toBe(0);
  });

  it("should keep only last 50 snapshots", () => {
    for (let i = 0; i < 60; i++) {
      takeSnapshot([{ id: i }], [], historyRef, isUndoingRef);
    }
    expect(historyRef.current.length).toBe(50);
  });

  // ================= undo =================

  it("should restore previous state on undo", () => {
    const setNodes = vi.fn();
    const setEdges = vi.fn();
    const setSelectedNodeId = vi.fn();
    const setSelectedEdgeId = vi.fn();
    const setConfig = vi.fn();

    historyRef.current.push({
      nodes: [{ id: "1" }],
      edges: [{ id: "e1" }],
    });

    undo(
      historyRef,
      isUndoingRef,
      setNodes,
      setEdges,
      setSelectedNodeId,
      setSelectedEdgeId,
      setConfig
    );

    expect(setNodes).toHaveBeenCalledWith([{ id: "1" }]);
    expect(setEdges).toHaveBeenCalledWith([{ id: "e1" }]);
    expect(setSelectedNodeId).toHaveBeenCalledWith(null);
    expect(setSelectedEdgeId).toHaveBeenCalledWith(null);
    expect(setConfig).toHaveBeenCalledWith(null);
  });

  it("should not undo when history is empty", () => {
    const setNodes = vi.fn();
    undo(historyRef, isUndoingRef, setNodes);
    expect(setNodes).not.toHaveBeenCalled();
  });

  // ================= handleKeyPress =================

  it("should trigger undo on Ctrl+Z", () => {
    const undoFn = vi.fn();
    const event = {
      ctrlKey: true,
      key: "z",
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    handleKeyPress(event, undoFn);

    expect(undoFn).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("should copy config on Ctrl+C", () => {
    const setNodeToCopy = vi.fn();

    handleKeyPress(
      { ctrlKey: true, key: "c" },
      vi.fn(),
      vi.fn(),
      null,
      vi.fn(),
      setNodeToCopy,
      { id: "node1" },
      "node1"
    );

    expect(setNodeToCopy).toHaveBeenCalledWith({ id: "node1" });
  });

  it("should paste node on Ctrl+V", () => {
    const setNewNode = vi.fn();
    const setNodeToCopy = vi.fn();

    handleKeyPress(
      { ctrlKey: true, key: "v" },
      vi.fn(),
      vi.fn(),
      { id: "copied" },
      setNewNode,
      setNodeToCopy
    );

    expect(setNewNode).toHaveBeenCalledWith({ id: "copied" });
    expect(setNodeToCopy).toHaveBeenCalledWith(null);
  });

  it("should trigger delete on Delete key", () => {
    const takeSnapshotFn = vi.fn();
    const setShouldDelete = vi.fn();

    handleKeyPress(
      { key: "Delete" },
      vi.fn(),
      takeSnapshotFn,
      null,
      vi.fn(),
      vi.fn(),
      { id: "config" },
      "1",
      setShouldDelete
    );

    expect(takeSnapshotFn).toHaveBeenCalled();
    expect(setShouldDelete).toHaveBeenCalledWith(true);
  });

  // ================= snapping helpers =================

  it("shouldApplySnapping returns false for invalid change", () => {
    expect(shouldApplySnapping({}, null)).toBe(false);
  });

  it("shouldApplySnapping returns true when dragging", () => {
    expect(
      shouldApplySnapping(
        { type: "position", position: {}, dragging: true },
        null
      )
    ).toBe(true);
  });

  it("isValidSnapDistance validates snap range", () => {
    expect(
      isValidSnapDistance({ x: 2, y: 2 }, { x: 0, y: 0 })
    ).toBe(true);

    expect(
      isValidSnapDistance({ x: 10, y: 10 }, { x: 0, y: 0 })
    ).toBe(false);
  });

  it("applySnappingToChange returns original when snapping not allowed", () => {
    const change = { id: "1", type: "other" };
    expect(
      applySnappingToChange(change, null, vi.fn(), vi.fn())
    ).toBe(change);
  });

  it("applySnappingToChange applies snapping correctly", () => {
    const change = {
      id: "1",
      type: "position",
      position: { x: 1, y: 1 },
      dragging: true,
    };

    const snapped = applySnappingToChange(
      change,
      null,
      () => false,
      () => ({ x: 2, y: 2 })
    );

    expect(snapped.position).toEqual({ x: 2, y: 2 });
  });

  it("applySnappingToChanges maps over changes", () => {
    const changes = [
      { id: "1", type: "position", position: { x: 1, y: 1 }, dragging: true },
    ];

    const result = applySnappingToChanges(
      changes,
      null,
      () => false,
      () => ({ x: 2, y: 2 })
    );

    expect(result[0].position).toEqual({ x: 2, y: 2 });
  });
});
 