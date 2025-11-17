import { memo } from 'react';
import { getNodeGradient } from "../../utils";
import { svgMap } from '../../svgMap';
import BaseSvgNode from '../BaseSvgNode';
import { useNodeCommon } from '../useNodeCommon';

export const CompressorConfigNodeFieldConfig = {
    fields: [
        { label: "Node Color", name: "gradientColor", type: "gradientColor" },
        { label: "Stroke Color", name: "strokeColor", type: "color" },
        { label: "Sub System", name: "subSystem", type: "text" },
    ],
};

export const CompressorConfigNodeConfig = {
    name: "Compressor Config Node",
    nodeType: "compressor-config-node",
    type: "compressorConfigNode",
    position: { x: 0, y: 0 },
    data: {
        gradientStart: getNodeGradient()[0],
        gradientEnd: getNodeGradient()[1],
        strokeColor: "#000000",
        subSystem: null,
        svgPath: svgMap["compressor-config-node"] || null,
    },
};

export const CompressorConfigNode = ({ data, id, selected, type }) => {
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

export default memo(CompressorConfigNode);