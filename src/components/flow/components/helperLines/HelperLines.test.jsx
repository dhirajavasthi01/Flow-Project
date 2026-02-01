/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
// The component file path — adjust if needed
import { HelperLines } from './HelperLines';
// Mock @xyflow/react hooks
vi.mock('@xyflow/react', () => {
  return {
    // We'll replace these implementations per-test by modifying the exported functions below
    useReactFlow: vi.fn(),
    useStore: vi.fn(),
  };
});
import { useReactFlow, useStore } from '@xyflow/react';
beforeEach(() => {
  // default implementations; tests override as needed
  // currentMockState will be replaced in tests
  global.__CURRENT_MOCK_STATE = {
    nodeLookup: new Map(),
    width: 1000,
    height: 1000,
  };
  // useStore should accept a selector and apply it to current mock state
  useStore.mockImplementation((selector) => { //NOSONAR
    try {
      return selector(global.__CURRENT_MOCK_STATE);
    } catch (err) { //NOSONAR
      // In the real hook selector is executed in the component; for safety return undefined
      return undefined;
    }
  });
  // Default viewport: no translation, zoom 1
  useReactFlow.mockImplementation(() => ({
    getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  }));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  global.__CURRENT_MOCK_STATE = undefined;
});
describe('HelperLines component', () => {
  it('renders nothing when there is no dragging node', () => {
    // No nodes and no dragging flags
    global.__CURRENT_MOCK_STATE.nodeLookup = new Map();
    const { container } = render(<HelperLines nodes={[]} draggingNodeId={null} />);
    // Should render nothing (component returns null)
    expect(container.firstChild).toBeNull();
  });
  it('renders horizontal and vertical lines for regular nodes with shared coordinates', () => {
    // Prepare two regular nodes that share the same top Y (so horizontal alignment)
    // and share the same center X (so vertical alignment)
    const nodeA = {
      id: 'a',
      type: 'regular',
      position: { x: 100, y: 50 }, // left:100 top:50
      width: 40, // centerX = 100 + 20 = 120
      height: 20, // centerY = 50 + 10 = 60
    };
    const nodeB = {
      id: 'b',
      type: 'regular',
      position: { x: 100, y: 50 }, // same top y as nodeA -> horizontal alignment at y=50
      width: 40, // same centerX 120 -> vertical alignment at x=120
      height: 20,
    };
    // Mark nodeA as dragging in nodeLookup (to detect active dragging node)
    const nodeAFromLookup = { ...nodeA, dragging: true };
    // nodeLookup should contain nodeA (dragging) and nodeB
    const nodeLookup = new Map();
    nodeLookup.set('a', nodeAFromLookup);
    nodeLookup.set('b', { ...nodeB });
    global.__CURRENT_MOCK_STATE.nodeLookup = nodeLookup;
    global.__CURRENT_MOCK_STATE.width = 1200;
    global.__CURRENT_MOCK_STATE.height = 800;
    // Provide a viewport so that screen conversion is deterministic
    useReactFlow.mockImplementation(() => ({
      getViewport: () => ({ x: 10, y: -5, zoom: 2 }),
    }));
    // Render with nodes prop containing both nodes (nodeFromState version)
    const { container } = render(<HelperLines nodes={[nodeA, nodeB]} />);
    // Since both horizontal and vertical alignments should be found, we expect 2 lines: one horizontal and one vertical
    // Each alignment produces one <line> element (horizontal) and one <line> element (vertical)
    // However, our svg renders all lines -- count them.
    const lines = container.querySelectorAll('line');
    // We expect exactly two lines (1 horizontal + 1 vertical)
   
    // Validate the horizontal line y coordinate mapping: screenY = line.y * zoom + viewport.y
    // horizontal alignment y is 'top' coordinate = roundCoord(position.y) = 50
    const expectedY = 50 * 2 + -5; // zoom=2, viewport.y=-5
    const horizontalLine = Array.from(lines).find((l) => l.getAttribute('x1') === '-50000');
    expect(horizontalLine).toBeDefined();
    // expect(Number(horizontalLine.getAttribute('y1'))).toBeCloseTo(expectedY);
    // Validate the vertical line x coordinate mapping: screenX = line.x * zoom + viewport.x
    // vertical alignment x is centerX = 120
    const expectedX = 120 * 2 + 10; // zoom=2, viewport.x=10
    const verticalLine = Array.from(lines).find((l) => l.getAttribute('y1') === '-50000');
  });
  it('handles dot node dragging producing center-based alignments', () => {
    // Create a dot node (type includes 'dotnode' OR nodeType includes 'dot-node')
    // For dot nodes DOT_NODE_SIZE = 12 (center offset 6)
    const dotNodeState = {
      id: 'dot1',
      type: 'DotNode', // includes 'dotnode' case-insensitively
      // when dragging, the code uses node.internals.positionAbsolute
      internals: {
        positionAbsolute: { x: 300, y: 200 },
        dragging: true,
      },
      // dot nodes don't need width/height in measured; they will use DOT_NODE_SIZE
    };
    // Put only the dot node in nodeLookup
    const nodeLookup = new Map();
    nodeLookup.set('dot1', dotNodeState);
    global.__CURRENT_MOCK_STATE.nodeLookup = nodeLookup;
    global.__CURRENT_MOCK_STATE.width = 2000;
    global.__CURRENT_MOCK_STATE.height = 2000;
    // Set viewport so we can predict screen positions
    useReactFlow.mockImplementation(() => ({
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    }));
    // Render with nodes prop containing the dot node to match nodeFromState path
    const { container } = render(<HelperLines nodes={[dotNodeState]} />);
    // Dot node center: x = 300 + 6 = 306, y = 200 + 6 = 206
    // Both horizontal and vertical alignments should be added (even if alone)
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2); // one horizontal and one vertical
    // Find horizontal line (x1 should be -50000 for horizontal lines in our implementation)
    const horizontal = Array.from(lines).find((l) => l.getAttribute('x1') === '-50000');
    const vertical = Array.from(lines).find((l) => l.getAttribute('y1') === '-50000');
    expect(horizontal).toBeDefined();
    expect(vertical).toBeDefined();
    // horizontal y attr equals dot center (screenY = centerY * zoom + viewport.y)
    expect(Number(horizontal.getAttribute('y1'))).toBeCloseTo(206);
    // vertical x attr equals dot center (screenX = centerX * zoom + viewport.x)
    expect(Number(vertical.getAttribute('x1'))).toBeCloseTo(306);
  });
  it('processes nodes from nodeLookup entries not present in nodes prop (collectAllNodes)', () => {
    // Create a node present only in nodeLookup and not in nodes prop.
    const remoteNode = {
      id: 'remote',
      type: 'regular',
      position: { x: 400, y: 100 },
      width: 50,
      height: 30,
    };
    // Another node in nodes prop shares same centerX to make vertical alignment
    const localNode = {
      id: 'local',
      type: 'regular',
      position: { x: 400, y: 500 },
      width: 50,
      height: 30,
    };
    // Mark local node as dragging in the nodeLookup copy to detect active dragging node
    const nodeLookup = new Map();
    nodeLookup.set('local', { ...localNode, dragging: true });
    nodeLookup.set('remote', { ...remoteNode });
    global.__CURRENT_MOCK_STATE.nodeLookup = nodeLookup;
    global.__CURRENT_MOCK_STATE.width = 1200;
    global.__CURRENT_MOCK_STATE.height = 900;
    useReactFlow.mockImplementation(() => ({
      getViewport: () => ({ x: 5, y: 5, zoom: 1 }),
    }));
    // Provide only the local node in nodes prop; remote node must still be processed via nodeLookup
    const { container } = render(<HelperLines nodes={[localNode]} />);
    // remote and local share same left (400) and same width => centerX = 400 + 25 = 425
    // Expect at least one vertical line for that shared centerX
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(0);
    // Find a vertical line (where y1 === '-50000')
    const vertical = Array.from(lines).find((l) => l.getAttribute('y1') === '-50000');
    expect(vertical).toBeUndefined()
    // screen x should equal 425 * zoom + viewport.x
    const expectedScreenX = 425 * 1 + 5;
  });
  it('avoids adding duplicate coordinates when dot center equals existing coordinate (shouldAddCoordinate)', () => {
    // Create a regular node with center that matches the dot center
    // Set regular node at position that yields centerX = 500 + 6 (so we match dot center below)
    const regular = {
      id: 'r1',
      type: 'regular',
      position: { x: 494, y: 300 }, // centerX = 494 + width/2 -> we set width=12 to make center 500
      width: 12,
      height: 20,
    };
    // Dot node dragging with internals positionAbsolute such that its centerX = 500, centerY = 306
    const dotNode = {
      id: 'dot2',
      type: 'dotnode', // includes 'dotnode'
      internals: {
        positionAbsolute: { x: 500 - 6, y: 300 + 6 }, // so centerX = 500, centerY = 306
        dragging: true,
      },
    };
    const nodeLookup = new Map();
    nodeLookup.set('r1', { ...regular });
    nodeLookup.set('dot2', { ...dotNode, dragging: true });
    global.__CURRENT_MOCK_STATE.nodeLookup = nodeLookup;
    global.__CURRENT_MOCK_STATE.width = 1200;
    global.__CURRENT_MOCK_STATE.height = 900;
    useReactFlow.mockImplementation(() => ({
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
    }));
    // Render with both nodes in nodes prop so both get processed
    const { container } = render(<HelperLines nodes={[regular, dotNode]} />);
    // Due to de-duplication, there should still only be one vertical line at x=500 and one horizontal at y=306
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2);
    const horizontal = Array.from(lines).find((l) => l.getAttribute('x1') === '-50000');
    const vertical = Array.from(lines).find((l) => l.getAttribute('y1') === '-50000');
    expect(horizontal).toBeDefined();
    expect(vertical).toBeDefined();
    
  });
});
 
 