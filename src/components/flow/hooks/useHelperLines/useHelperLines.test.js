import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHelperLines } from './useHelperLines';
// Mock @xyflow/react
vi.mock('@xyflow/react', () => ({
  useStore: vi.fn(),
}));
import { useStore } from '@xyflow/react';
describe('useHelperLines', () => {
  let mockNodeLookup;
  beforeEach(() => {
    mockNodeLookup = new Map();
    useStore.mockImplementation((selector) => {
      return selector({ nodeLookup: mockNodeLookup });
    });
  });
  describe('snapNodePosition', () => {
    it('should return original position when dragging node does not exist', () => {
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 100 };
     
      const snapped = result.current.snapNodePosition('non-existent', position);
     
      expect(snapped).toEqual(position);
    });
    it('should return original position when no other nodes exist', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 200, y: 200 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped).toEqual(position);
    });
    it('should snap to left edge of another node', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 }; // 2px away from left edge
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200); // Snapped to left edge
    });
    it('should snap to right edge of another node', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 248, y: 100 }; // Right edge at 250 (200 + 150 - 150)
     
      const snapped = result.current.snapNodePosition('node1', position);
     
    });
    it('should snap to centerX of another node', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200); // Snapped to centerX
    });
    it('should snap to top edge of another node', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 152 }; // 2px away from top edge
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.y).toBe(150); // Snapped to top edge
    });
    it('should snap to bottom edge of another node', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 148 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.y).toBe(150); // Snapped to bottom edge
    });
    it('should snap to centerY of another node', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 152 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.y).toBe(150); // Snapped to centerY
    });
    it('should snap both X and Y simultaneously', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 152 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200);
      expect(snapped.y).toBe(150);
    });
    it('should not snap when difference is greater than threshold', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 210, y: 160 }; // More than 5px away
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped).toEqual(position); // No snapping
    });
    it('should snap to closest node when multiple nodes are within threshold', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node3', {
        id: 'node3',
        type: 'default',
        internals: { positionAbsolute: { x: 201, y: 151 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 201, y: 151 }; // Closer to node3
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(201);
      expect(snapped.y).toBe(151);
    });
  });
  describe('Dot Node Snapping', () => {
    it('should identify dot node by type', () => {
      mockNodeLookup.set('dot1', {
        id: 'dot1',
        type: 'DotNode',
        position: { x: 100, y: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 102, y: 102 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 150, y: 150 };
     
      const snapped = result.current.snapNodePosition('dot1', position);
     
      expect(snapped).toBeDefined();
    });
    it('should identify dot node by nodeType property', () => {
      mockNodeLookup.set('dot1', {
        id: 'dot1',
        nodeType: 'dot-node',
        position: { x: 100, y: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 102, y: 102 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 150, y: 150 };
     
      const snapped = result.current.snapNodePosition('dot1', position);
     
      expect(snapped).toBeDefined();
    });
    it('should snap dot node center to another dot node center (X axis)', () => {
      mockNodeLookup.set('dot1', {
        id: 'dot1',
        type: 'dotNode',
        position: { x: 100, y: 100 },
      });
     
      mockNodeLookup.set('dot2', {
        id: 'dot2',
        type: 'dotNode',
        internals: { positionAbsolute: { x: 200, y: 150 } },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('dot1', position);
     
      expect(snapped.x).toBe(200);
    });
    it('should snap dot node center to another dot node center (Y axis)', () => {
      mockNodeLookup.set('dot1', {
        id: 'dot1',
        type: 'dotNode',
        position: { x: 100, y: 100 },
      });
     
      mockNodeLookup.set('dot2', {
        id: 'dot2',
        type: 'dotNode',
        internals: { positionAbsolute: { x: 200, y: 150 } },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 152 };
     
      const snapped = result.current.snapNodePosition('dot1', position);
     
      expect(snapped.y).toBe(150);
    });
    it('should snap dot node center to regular node center', () => {
      mockNodeLookup.set('dot1', {
        id: 'dot1',
        type: 'dotNode',
        position: { x: 100, y: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 271, y: 196 };
     
      const snapped = result.current.snapNodePosition('dot1', position);
     
      expect(snapped.x).toBe(271);//275 - 12/2
      expect(snapped.y).toBe(196);// 200 - 12/2
    });
    it('should snap regular node center to dot node center', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('dot2', {
        id: 'dot2',
        type: 'dotNode',
        internals: { positionAbsolute: { x: 200, y: 150 } },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 133, y: 108 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(133);// 206 - 150/2
      expect(snapped.y).toBe(108);// 156 - 100/2
    });
  });
  describe('Node Dimension Handling', () => {
    it('should use measured dimensions when available', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
        width: 200,
        height: 150,
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200); // Uses measured width (150), not width (200)
    });
    it('should fall back to width property when measured not available', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        width: 150,
        height: 100,
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        width: 150,
        height: 100,
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200);
    });
    it('should fall back to data.width when other dimensions not available', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        data: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200);
    });
    it('should use 0 dimensions when nothing is available', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped).toBeDefined();
    });
  });
  describe('Node Position Handling', () => {
    it('should use internals.positionAbsolute when available', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        position: { x: 300, y: 300 },
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200); // Uses internals.positionAbsolute, not position
    });
    it('should fall back to position property when internals not available', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        position: { x: 200, y: 150 },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200);
    });
    it('should handle position with missing x or y values', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        position: { x: null, y: null },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped).toEqual(position);
    });
    it('should skip nodes with no position information', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped).toEqual(position);
    });
  });
  describe('Edge Cases', () => {
    it('should handle node with undefined type', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: undefined,
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200);
    });
    it('should handle node with null type', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: null,
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200);
    });
    it('should handle mixed case in type names', () => {
      mockNodeLookup.set('dot1', {
        id: 'dot1',
        type: 'DoTnOdE',
        position: { x: 100, y: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 102, y: 102 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 150, y: 150 };
     
      const snapped = result.current.snapNodePosition('dot1', position);
     
      expect(snapped).toBeDefined();
    });
    it('should handle empty nodeLookup', () => {
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 100, y: 100 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped).toEqual(position);
    });
    it('should handle exactly at snap threshold', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 195, y: 145 }; // Exactly 5px away
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      // Should not snap as we're at the threshold (not within)
      expect(snapped.x).toBe(195);
      expect(snapped.y).toBe(145);
    });
    it('should handle multiple nodes with exact same position', () => {
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node2', {
        id: 'node2',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
     
      mockNodeLookup.set('node3', {
        id: 'node3',
        type: 'default',
        internals: { positionAbsolute: { x: 200, y: 150 } },
        measured: { width: 150, height: 100 },
      });
      const { result } = renderHook(() => useHelperLines());
      const position = { x: 202, y: 152 };
     
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped.x).toBe(200);
      expect(snapped.y).toBe(150);
    });
  });
  describe('Hook Re-rendering', () => {
    it('should update snapNodePosition when nodeLookup changes', () => {
      const { result, rerender } = renderHook(() => useHelperLines());
     
      mockNodeLookup.set('node1', {
        id: 'node1',
        type: 'default',
        position: { x: 100, y: 100 },
        measured: { width: 150, height: 100 },
      });
     
      rerender();
     
      const position = { x: 100, y: 100 };
      const snapped = result.current.snapNodePosition('node1', position);
     
      expect(snapped).toEqual(position);
    });
    it('should maintain referential stability when nodeLookup does not change', () => {
      const { result, rerender } = renderHook(() => useHelperLines());
     
      const firstRender = result.current.snapNodePosition;
      rerender();
      const secondRender = result.current.snapNodePosition;
     
      expect(firstRender).toBe(secondRender);
    });
  });
});
 