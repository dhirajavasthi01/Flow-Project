import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useAtomValue } from 'jotai';
import { showHandlesAtom } from '../../../../features/individualDetailWrapper/store/OverviewStore';
import { svgMap } from '../../svgMap';

export const DotFieldConfig = {
    fields: [
        { label: "Node Color", name: "nodeColor", type: "color" },
    ],
};

export const DotConfig = {
    name: "Dot Node",
    nodeType: "dot-node",
    type: "dotNode",
    position: { x: 0, y: 0 },
    data: {
        nodeColor: "#000000",
        svgPath: svgMap["dot-node"] || null,
    },
};

export const Dot = ({ data, id }) => {
    const { nodeColor } = data;
    const showHandles = useAtomValue(showHandlesAtom);

    const dotVisibility = {
        width: '15px',
        height: '15px',
        position: 'relative',
        borderRadius: '50%',
        backgroundColor: nodeColor,
        opacity: showHandles ? 1 : 0
    }

    const dotStyle = {
        width: '12px',
        height: '12px',
        backgroundColor: nodeColor,
        borderRadius: '50%',
        opacity: showHandles ? 1 : 0,
        marginTop: '5px'
    };

    const centerHandleStyle = {
        width: '6px',
        height: '6px',
        position: 'relative',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer'
    };

    return (
        <>
            <div style={dotStyle}>
            <Handle
                key={`${id}-center-handle`}
                type="source"
                id={`${id}-center`}
                position={Position.Top} 
                style={centerHandleStyle}
            />
        </div>
        </>
    );
};

export default memo(Dot);