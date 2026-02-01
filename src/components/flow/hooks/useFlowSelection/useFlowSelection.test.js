import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFlowSelection } from './useFlowSelection';
describe('useFlowSelection', () => {
  describe('Basic Functionality', () => {
    it('should return empty arrays when no nodes or edges are provided', () => {
      const { result } = renderHook(() => useFlowSelection([], []));
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.selectedEdges).toEqual([]);
      expect(result.current.connectedEdges).toEqual([]);
      expect(result.current.allEdges).toEqual([]);
    });
    it('should handle undefined nodes and edges', () => {
      const { result } = renderHook(() => useFlowSelection(undefined, undefined));
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.selectedEdges).toEqual([]);
      expect(result.current.connectedEdges).toEqual([]);
      expect(result.current.allEdges).toEqual([]);
    });
    it('should handle null nodes and edges', () => {
      const { result } = renderHook(() => useFlowSelection(null, null));
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.selectedEdges).toEqual([]);
      expect(result.current.connectedEdges).toEqual([]);
      expect(result.current.allEdges).toEqual([]);
    });
  });
  describe('Selected Nodes', () => {
    it('should filter selected nodes correctly', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: false },
        { id: '3', selected: true }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, []));
      expect(result.current.selectedNodes).toHaveLength(2);
      expect(result.current.selectedNodes).toEqual([
        { id: '1', selected: true },
        { id: '3', selected: true }
      ]);
    });
    it('should return empty array when no nodes are selected', () => {
      const nodes = [
        { id: '1', selected: false },
        { id: '2', selected: false }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, []));
      expect(result.current.selectedNodes).toEqual([]);
    });
    it('should return all nodes when all are selected', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: true }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, []));
      expect(result.current.selectedNodes).toHaveLength(2);
    });
  });
  describe('Selected Edges', () => {
    it('should filter selected edges correctly', () => {
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: true },
        { id: 'e2', source: '2', target: '3', selected: false },
        { id: 'e3', source: '3', target: '4', selected: true }
      ];
      const { result } = renderHook(() => useFlowSelection([], edges));
      expect(result.current.selectedEdges).toHaveLength(2);
      expect(result.current.selectedEdges.map(e => e.id)).toEqual(['e1', 'e3']);
    });
    it('should return empty array when no edges are selected', () => {
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: false }
      ];
      const { result } = renderHook(() => useFlowSelection([], edges));
      expect(result.current.selectedEdges).toEqual([]);
    });
  });
  describe('Connected Edges', () => {
    it('should find edges connecting selected nodes', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: true },
        { id: '3', selected: false }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: false },
        { id: 'e2', source: '2', target: '3', selected: false },
        { id: 'e3', source: '1', target: '3', selected: false }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.connectedEdges).toHaveLength(1);
      expect(result.current.connectedEdges[0].id).toBe('e1');
    });
    it('should not include edges with only one endpoint selected', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: false }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: false }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.connectedEdges).toEqual([]);
    });
    it('should find multiple connected edges', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: true },
        { id: '3', selected: true }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: false },
        { id: 'e2', source: '2', target: '3', selected: false },
        { id: 'e3', source: '1', target: '3', selected: false }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.connectedEdges).toHaveLength(3);
    });
  });
  describe('All Edges', () => {
    it('should combine selected and connected edges', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: true },
        { id: '3', selected: false }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: false },
        { id: 'e2', source: '2', target: '3', selected: true },
        { id: 'e3', source: '3', target: '4', selected: false }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.allEdges).toHaveLength(2);
      expect(result.current.allEdges.map(e => e.id).sort()).toEqual(['e1', 'e2']);
    });
    it('should deduplicate edges that are both selected and connected', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: true }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: true }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.allEdges).toHaveLength(1);
      expect(result.current.selectedEdges).toHaveLength(1);
      expect(result.current.connectedEdges).toHaveLength(1);
    });
    it('should handle complex selection scenarios', () => {
      const nodes = [
        { id: '1', selected: true },
        { id: '2', selected: true },
        { id: '3', selected: false },
        { id: '4', selected: true }
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: false },
        { id: 'e2', source: '2', target: '3', selected: true },
        { id: 'e3', source: '1', target: '4', selected: true },
        { id: 'e4', source: '3', target: '4', selected: false },
        { id: 'e5', source: '2', target: '4', selected: false }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.selectedNodes).toHaveLength(3);
      expect(result.current.selectedEdges).toHaveLength(2);
      expect(result.current.connectedEdges).toHaveLength(3);
      expect(result.current.allEdges).toHaveLength(4);
    });
  });
  describe('Memoization', () => {
    it('should memoize results when inputs do not change', () => {
      const nodes = [{ id: '1', selected: true }];
      const edges = [{ id: 'e1', source: '1', target: '2', selected: false }];
      const { result, rerender } = renderHook(
        ({ n, e }) => useFlowSelection(n, e),
        { initialProps: { n: nodes, e: edges } }
      );
      const firstResult = result.current;
      rerender({ n: nodes, e: edges });
      expect(result.current).toBe(firstResult);
    });
    it('should recalculate when nodes change', () => {
      const nodes1 = [{ id: '1', selected: true }];
      const nodes2 = [{ id: '1', selected: false }];
      const edges = [];
      const { result, rerender } = renderHook(
        ({ n, e }) => useFlowSelection(n, e),
        { initialProps: { n: nodes1, e: edges } }
      );
      const firstResult = result.current;
      expect(firstResult.selectedNodes).toHaveLength(1);
      rerender({ n: nodes2, e: edges });
      expect(result.current).not.toBe(firstResult);
      expect(result.current.selectedNodes).toHaveLength(0);
    });
    it('should recalculate when edges change', () => {
      const nodes = [{ id: '1', selected: true }];
      const edges1 = [{ id: 'e1', source: '1', target: '2', selected: true }];
      const edges2 = [{ id: 'e2', source: '2', target: '3', selected: true }];
      const { result, rerender } = renderHook(
        ({ n, e }) => useFlowSelection(n, e),
        { initialProps: { n: nodes, e: edges1 } }
      );
      const firstResult = result.current;
      rerender({ n: nodes, e: edges2 });
      expect(result.current).not.toBe(firstResult);
      expect(result.current.selectedEdges[0].id).toBe('e2');
    });
  });
  describe('Edge Cases', () => {
    it('should handle nodes with additional properties', () => {
      const nodes = [
        { id: '1', selected: true, data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
        { id: '2', selected: false, data: { label: 'Node 2' }, position: { x: 100, y: 100 } }
      ];
      const { result } = renderHook(() => useFlowSelection(nodes, []));
      expect(result.current.selectedNodes).toHaveLength(1);
      expect(result.current.selectedNodes[0].data).toEqual({ label: 'Node 1' });
    });
    it('should handle edges with additional properties', () => {
      const edges = [
        { id: 'e1', source: '1', target: '2', selected: true, animated: true }
      ];
      const { result } = renderHook(() => useFlowSelection([], edges));
      expect(result.current.selectedEdges[0].animated).toBe(true);
    });
    it('should handle self-referencing edges', () => {
      const nodes = [{ id: '1', selected: true }];
      const edges = [{ id: 'e1', source: '1', target: '1', selected: false }];
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.connectedEdges).toHaveLength(1);
    });
    it('should handle large datasets', () => {
      const nodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        selected: i % 2 === 0
      }));
      const edges = Array.from({ length: 500 }, (_, i) => ({
        id: `e${i}`,
        source: `${i * 2}`,
        target: `${i * 2 + 2}`,
        selected: false
      }));
      const { result } = renderHook(() => useFlowSelection(nodes, edges));
      expect(result.current.selectedNodes).toHaveLength(500);
      expect(result.current.connectedEdges.length).toBeGreaterThan(0);
    });
  });
});
 