import { getSmoothStepPath } from "@xyflow/react";
const FlowingPipeEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, type }) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const getCssNameByType = () => {
    if (type) {
      return `edgeStoke-${type}`;
    }
    return "";
  };

  return (
    <>
      <path id={id} style={{ ...style }} className={`react-flow__edge-path flowingPipe ${getCssNameByType()}`} d={edgePath} markerEnd={markerEnd} />
      <path id={id} style={{ ...style }} className={`react-flow__edge-path flowingPipeAnimated ${getCssNameByType()}`} d={edgePath} markerEnd={markerEnd} />
    </>
  );
};

export default FlowingPipeEdge;
