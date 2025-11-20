import { memo } from 'react';
import { svgMap } from '../../svgMap';
import BaseSvgNode from '../BaseSvgNode';
import { useNodeCommon } from '../useNodeCommon';

export const CompressorBearingNodeFieldConfig = {
    fields: [
        { label: "Node Color", name: "nodeColor", type: "color" },
        { label: "Stroke Color", name: "strokeColor", type: "color" },
        { label: "Sub System", name: "subSystem", type: "text" },
    ],
};

export const CompressorBearingNodeConfig = {
    name: "Compressor Bearing Node",
    nodeType: "compressor-bearing-node",
    type: "CompressorBearingNode",
    position: { x: 0, y: 0 },
    data: {
        nodeColor: "#d3d3d3",
        strokeColor: "#000000",
        svgPath: svgMap["compressor-bearing-node"] || null,
    }
};

export const CompressorBearingNode = ({ data, id, selected, type }) => {
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

export default memo(CompressorBearingNode);