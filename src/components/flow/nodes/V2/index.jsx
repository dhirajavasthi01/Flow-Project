import { memo } from 'react';
import { svgMap } from '../../svgMap';
import BaseSvgNode from '../BaseSvgNode';
import { useNodeCommon } from '../useNodeCommon';

export const V2NodeFieldConfig = {
    fields: [
        { label: "Node Color", name: "nodeColor", type: "gradientColor" },
        { label: "Stroke Color", name: "strokeColor", type: "color" },
        { label: "Sub System", name: "subSystem", type: "text" },  
     {
            label: "Target Handles",
            name: "targetHandles",
            type: "multi-select",
        },
    ],
};

export const V2NodeConfig = {
    name: "V2 Node",
    nodeType: "v2-node",
    type: "v2Node",
    position: { x: 0, y: 0 },
    data: {
        nodeColor: "#d3d3d3",
        strokeColor: "#000000",
        subSystem: null,
        svgPath: svgMap["v2-node"] || null,
        targetHandles: [],
    },
};

export const V2Node = ({ data, id, selected, type }) => {
    const { svgPath } = data;
    const nodeCommon = useNodeCommon(id, data);

    return (
        <BaseSvgNode
            id={id}
            data={data}
            selected={selected}
            type={type}
            svgPath={svgPath}
            isDeveloperMode={nodeCommon.isDeveloperMode}
            isSelected={nodeCommon.isSelected}
            isHighlighted={nodeCommon.isHighlighted}
            isNodeActive={nodeCommon.selectedId === id}
            nodeCommon={nodeCommon}
        />
    );
};

export default memo(V2Node);