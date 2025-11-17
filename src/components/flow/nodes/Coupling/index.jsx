import { memo } from 'react';
import { svgMap } from '../../svgMap';
import BaseSvgNode from '../BaseSvgNode';
import { useNodeCommon } from '../useNodeCommon';

export const CouplingNodeFieldConfig = {
    fields: [
        { label: "Is Active", name: "isActive", type: "switch" },
        { label: "Node Color", name: "nodeColor", type: "gradientColor" },
        { label: "Stroke Color", name: "strokeColor", type: "color" },
        { label: "Width", name: "width", type: "number", min: 100 },
        { label: "Height", name: "height", type: "number", min: 100 },
    ],
    showLinkModal: true,
};
export const CouplingNodeConfig = {
    name: "Coupling Node",
    nodeType: "coupling-node",
    type: "couplingNode",
    position: { x: 0, y: 0 },
    data: {
        isActive: false,
        linkedTag: null,
        subSystem: null,
        nodeColor: "#a9a6a6",
        strokeColor: "#000000",
        svgPath: svgMap["coupling-node"] || null,
        // width: 230,
        // height: 260,
    },
};

const CouplingNode = ({ data, id, selected, type }) => {
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