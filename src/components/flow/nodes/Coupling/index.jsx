import { memo } from 'react';
import { svgMap } from '../../svgMap';
import BaseSvgNode from '../BaseSvgNode';
import { useNodeCommon } from '../useNodeCommon';

export const CouplingNodeFieldConfig = {
    fields: [
        { label: "Node Color", name: "nodeColor", type: "color" },
        { label: "Stroke Color", name: "strokeColor", type: "color" },
        { label: "Sub System", name: "subSystem", type: "text" },
    ],
};
export const CouplingNodeConfig = {
    name: "Coupling Node",
    nodeType: "coupling-node",
    type: "couplingNode",
    position: { x: 0, y: 0 },
    data: {
        subSystem: null,
        nodeColor: "#a9a6a6",
        strokeColor: "#000000",
        svgPath: svgMap["coupling-node"] || null,
    },
};

export const CouplingNode = ({ data, id, selected, type }) => {
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

export default memo(CouplingNode);