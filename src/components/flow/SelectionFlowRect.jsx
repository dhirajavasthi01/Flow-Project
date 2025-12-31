import { useRef, useState, useCallback } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';
import { nodeOverlapsRect , nodeIsFullyContained} from './SelectionFlowReact.functions';
export function SelectionFlowRect({ partial }) {
  const { setNodes, getViewport } = useReactFlow();
  const { width, height, nodeLookup } = useStore((state) => ({
    width: state.width,
    height: state.height,
    nodeLookup: state.nodeLookup,
  }));
  const canvas = useRef(null);
  const ctx = useRef(null);
  const startPoint = useRef(null);
  const [, setCurrentRect] = useState(null);
  const drawSelectionRect = useCallback((rectX, rectY, rectW, rectH) => {
    if (ctx.current) {
      ctx.current.clearRect(0, 0, width, height);
      ctx.current.fillRect(rectX, rectY, rectW, rectH);
      ctx.current.strokeRect(rectX, rectY, rectW, rectH);
    }
  }, [width, height]);
  function handlePointerDown(e) {
    console.log('check handle fun')
    e.target.setPointerCapture(e.pointerId);
    const canvasRect = canvas.current.getBoundingClientRect();
    const startX = e.clientX - canvasRect.left;
    const startY = e.clientY - canvasRect.top;
    startPoint.current = [startX, startY];
    setCurrentRect({ x: startX, y: startY, width: 0, height: 0 });
    ctx.current = canvas.current?.getContext('2d');
    if (!ctx.current) return;
    ctx.current.lineWidth = 1;
    ctx.current.fillStyle = 'rgba(0, 89, 220, 0.08)';
    ctx.current.strokeStyle = 'rgba(0, 89, 220, 0.8)';
  }
  const getSelectedNodeIds = useCallback((x, y, w, h) => {
    const viewport = getViewport();
    const nodesToSelect = new Set();
    const rectTopLeft = {
      x: x / viewport.zoom - viewport.x / viewport.zoom,
      y: y / viewport.zoom - viewport.y / viewport.zoom,
    };
    const rectBottomRight = {
      x: (x + w) / viewport.zoom - viewport.x / viewport.zoom,
      y: (y + h) / viewport.zoom - viewport.y / viewport.zoom,
    };
    for (const node of nodeLookup.values()) {
        const overlaps = nodeOverlapsRect(node, rectTopLeft, rectBottomRight);
        if (overlaps) {
            if (partial) {
                nodesToSelect.add(node.id);
            } else {
                const fullyContained = nodeIsFullyContained(node, rectTopLeft, rectBottomRight);
                if (fullyContained) {
                    nodesToSelect.add(node.id);
                }
            }
        }
    }
    return nodesToSelect;
  }, [getViewport, nodeLookup, partial]);
  function handlePointerMove(e) {
    if (e.buttons !== 1 || !startPoint.current) return;
    const canvasRect = canvas.current.getBoundingClientRect();
    const [startX, startY] = startPoint.current;
    const currentX = e.clientX - canvasRect.left;
    const currentY = e.clientY - canvasRect.top;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(startX - currentX);
    const h = Math.abs(startY - currentY);
    setCurrentRect({ x, y, width: w, height: h });
    drawSelectionRect(x, y, w, h);
    const nodesToSelect = getSelectedNodeIds(x, y, w, h);
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        selected: nodesToSelect.has(node.id),
      }))
    );
  }
  function handlePointerUp(e) {
    e.target.releasePointerCapture(e.pointerId);
    startPoint.current = null;
    if (ctx.current) {
      ctx.current.clearRect(0, 0, width, height);
    }
  }
  return (
<canvas
      ref={canvas}
      width={width}
      height={height}
      className="tool-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'auto',
        cursor: 'crosshair',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}