import { memo } from 'react';
import { svgMap } from '../../svgMap';
import BaseSvgNode from '../BaseSvgNode';
import { useNodeCommon } from '../useNodeCommon';
 

export const HeatExchangerNodeFieldConfig = {
    fields: [
        { label: "Node Color", name: "nodeColor", type: "gradientColor" },
        { label: "Stroke Color", name: "strokeColor", type: "color" },
        {
            label: "Target Handles",
            name: "targetHandles",
            type: "multi-select",
        },

    ],
    showLinkModal: true,
};

export const HeatExchangerNodeConfig = {
    name: "Heat Exchanger Node",
    nodeType: "heat-exchanger-node",
    type: "heatExchangerNode",
    position: { x: 0, y: 0 },
    data: {
        nodeColor: "#d3d3d3",
        strokeColor: "#000000",
        subSystem: null,
        svgPath:  svgMap["heat-exchanger-node"] || null,
        targetHandles: [],
    },
};

export const HeatExchangerNode = ({ data, id, selected, type }) => {
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
            svgNodeProps={{
                defaultWidth: data.width,
                defaultHeight: data.height,
            }}
        />
    );
};

export default memo(HeatExchangerNode);