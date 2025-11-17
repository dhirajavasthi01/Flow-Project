import { useCallback } from "react";

export function useTextBoxClickHandler() {
  const handleTextBoxClick = useCallback(
    (event, node, { nodeLookup, isDeveloperMode, screenToFlowPosition, getNodes, setNodes }) => {
      if (!node || !setNodes) return null;

      // --- Handle text box node click ---
      if (node.type === "textBoxNode" && !isDeveloperMode) {
        const point = screenToFlowPosition({
          x: event.clientX || 0,
          y: event.clientY || 0,
        });

        let bestMatch = null;
        for (const n of nodeLookup.values()) {
          if (!n || n.id === node.id || n.type === "textBoxNode") continue;

          const w = n.measured?.width || 0;
          const h = n.measured?.height || 0;
          if (w === 0 || h === 0) continue;

          const left = n.internals.positionAbsolute.x;
          const top = n.internals.positionAbsolute.y;
          const right = left + w;
          const bottom = top + h;

          const contains =
            point.x >= left &&
            point.x <= right &&
            point.y >= top &&
            point.y <= bottom;

          if (!contains) continue;

          const z = n.internals?.z || 0;
          if (!bestMatch || z > bestMatch.z) {
            bestMatch = { id: n.id, z, node: n };
          }
        }

        if (bestMatch) {
          const allNodes = getNodes();
          const targetNode = allNodes.find((n) => n.id === bestMatch.id);

          if (targetNode) {
            setNodes((nodes) =>
              nodes.map((n) => ({
                ...n,
                selected: n.id === bestMatch.id,
              }))
            );
            return targetNode;
          }
        }
        return null;
      }

      // --- Handle click on overlapping text box ---
      if (!isDeveloperMode) {
        const clickedNode = nodeLookup.get(node.id);
        if (!clickedNode) return null;

        const clickedNodePos = clickedNode.internals.positionAbsolute;
        const clickedNodeWidth = clickedNode.measured?.width || 0;
        const clickedNodeHeight = clickedNode.measured?.height || 0;

        const hasTextBoxOverlap = Array.from(nodeLookup.values()).some((n) => {
          if (!n || n.type !== "textBoxNode" || n.id === node.id) return false;

          const textBoxPos = n.internals.positionAbsolute;
          const textBoxWidth = n.measured?.width || 0;
          const textBoxHeight = n.measured?.height || 0;

          return (
            textBoxPos.x < clickedNodePos.x + clickedNodeWidth &&
            textBoxPos.x + textBoxWidth > clickedNodePos.x &&
            textBoxPos.y < clickedNodePos.y + clickedNodeHeight &&
            textBoxPos.y + textBoxHeight > clickedNodePos.y
          );
        });

        if (hasTextBoxOverlap) {
          const candidates = [];

          for (const n of nodeLookup.values()) {
            if (!n || n.id === node.id || n.type === "textBoxNode") continue;

            const w = n.measured?.width || 0;
            const h = n.measured?.height || 0;
            if (w === 0 || h === 0) continue;

            const left = n.internals.positionAbsolute.x;
            const top = n.internals.positionAbsolute.y;
            const right = left + w;
            const bottom = top + h;

            const overlapLeft = Math.max(left, clickedNodePos.x);
            const overlapTop = Math.max(top, clickedNodePos.y);
            const overlapRight = Math.min(right, clickedNodePos.x + clickedNodeWidth);
            const overlapBottom = Math.min(bottom, clickedNodePos.y + clickedNodeHeight);

            const overlapArea =
              Math.max(0, overlapRight - overlapLeft) * Math.max(0, overlapBottom - overlapTop);

            candidates.push({ id: n.id, node: n, overlapArea, z: n.internals?.z || 0 });
          }

          candidates.sort((a, b) =>
            b.overlapArea !== a.overlapArea
              ? b.overlapArea - a.overlapArea
              : b.z - a.z
          );

          if (candidates.length > 0) {
            const bestMatch = candidates[0];
            const targetNode = getNodes().find((n) => n.id === bestMatch.id);

            if (targetNode) {
              setNodes((nodes) =>
                nodes.map((n) => ({
                  ...n,
                  selected: n.id === bestMatch.id,
                }))
              );
              return targetNode;
            }
          }
        }
      }

      return null;
    },
    []
  );

  return handleTextBoxClick;
}
