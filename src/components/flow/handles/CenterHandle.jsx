import { Handle, Position } from '@xyflow/react';

const CenterHandle = ({ id }) => {

    return (
        <>
            <Handle
                key={`${id}-center-handle`}
                type="source"
                position={Position.Top}
                id={`${id}-center`}
            />
        </>
    );
};

export default CenterHandle;