import { useRef, useState } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';

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
  const [currentRect, setCurrentRect] = useState(null);

  function handlePointerDown(e) {
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

    if (ctx.current) {
      ctx.current.clearRect(0, 0, width, height);
      ctx.current.fillRect(x, y, w, h);
      ctx.current.strokeRect(x, y, w, h);
    }

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
      const nodeLeft = node.internals.positionAbsolute.x;
      const nodeTop = node.internals.positionAbsolute.y;
      const nodeRight = nodeLeft + (node.measured?.width || 0);
      const nodeBottom = nodeTop + (node.measured?.height || 0);

      const overlaps =
        rectTopLeft.x < nodeRight &&
        rectBottomRight.x > nodeLeft &&
        rectTopLeft.y < nodeBottom &&
        rectBottomRight.y > nodeTop;

      if (overlaps) {
        if (partial) {
          nodesToSelect.add(node.id);
        } else {
          const fullyContained =
            rectTopLeft.x <= nodeLeft &&
            rectBottomRight.x >= nodeRight &&
            rectTopLeft.y <= nodeTop &&
            rectBottomRight.y >= nodeBottom;

          if (fullyContained) {
            nodesToSelect.add(node.id);
          }
        }
      }
    }

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
