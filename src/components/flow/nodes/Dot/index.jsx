import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useAtomValue } from 'jotai';
import { showHandlesAtom } from '../../../../features/individualDetailWrapper/store/OverviewStore';
import { svgMap } from '../../svgMap';

export const DotFieldConfig = {
  fields: [{ label: "Node Color", name: "nodeColor", type: "color" }],
};

export const DotConfigTop = {
  name: "Dot Node",
  nodeType: "dot-node-top",
  type: "dotNodeTop",
  position: { x: 0, y: 0 },
  data: {
    dotPosition: "top",
    nodeColor: "#000000",
  },
};

export const DotConfigBottom = {
  name: "Dot Node",
  nodeType: "dot-node-bottom",
  type: "dotNodeBottom",
  position: { x: 0, y: 0 },
  data: {
    dotPosition: "bottom",
    nodeColor: "#000000",
  },
};

export const DotConfigRight = {
  name: "Dot Node",
  nodeType: "dot-node-right",
  type: "dotNodeRight",
  position: { x: 0, y: 0 },
  data: {
    dotPosition: "right",
    nodeColor: "#000000",
  },
};

export const DotConfigLeft = {
  name: "Dot Node",
  nodeType: "dot-node-left",
  type: "dotNodeLeft",
  position: { x: 0, y: 0 },
  data: {
    dotPosition: "left",
    nodeColor: "#000000",
  },
};

export const Dot = ({ data, id }) => {
  const { nodeColor, dotPosition } = data;
  const showHandles = useAtomValue(showHandlesAtom);

    const dotStyle = {
    width: "12px",
    height: "12px",
    backgroundColor: nodeColor,
    borderRadius: "50%",
    opacity: showHandles ? 1 : 0,
    marginTop: "5px",
    position: "relative",
  };

  const centerHandleStyle = {
    width: "6px",
    height: "6px",
    position: "absolute",
    left: "50%",
    transform: "translate(-50%, -50%)",
    cursor: "pointer",
  };

  const targetHandleStyle = {
    ...centerHandleStyle,
    top: "50%",
  };

  const sourceHandleStyle = {
    ...centerHandleStyle,
    top: "50%",
  };

  return (
    <div style={dotStyle}>
      <Handle
        key={`${id}-target-center`}
        type="target"
        id={`${id}-target-center`}
        position={dotPosition}
        style={sourceHandleStyle}
      />

      <Handle
        key={`${id}-source-center`}
        type="source"
        id={`${id}-source-center`}
        position={dotPosition}
        style={sourceHandleStyle}
      />
    </div>
  );
};

export default memo(Dot);
