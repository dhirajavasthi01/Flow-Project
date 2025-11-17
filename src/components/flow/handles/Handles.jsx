import { Handle, Position } from '@xyflow/react'
import { showHandlesAtom } from '../../../features/individualDetailWrapper/store/OverviewStore'
import { useAtomValue } from 'jotai'

const Handles = ({ id }) => {
    const showHandles = useAtomValue(showHandlesAtom);

    const handleStyle = {
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: showHandles ? 1 : 0,
        transition: 'opacity 0.3s ease',
        height: '7px',
        width: '7px'
    };
    
    const verticalHandleStyle = {
      ...handleStyle,
      top: 'auto', 
      left: '50%',
      transform: 'translateX(-50%)',
    }

    return (
        <>
            {/* Left Handles */}
             <Handle
                key={`${id}-target-left`}
                type="target"
                position={Position.Left}
                id={`${id}-target-left`}
                style={{ ...handleStyle, left: -4 }}
            />
            <Handle
                key={`${id}-source-left`}
                type="source"
                position={Position.Left}
                id={`${id}-source-left`}
                style={{ ...handleStyle, left: -4 }}
            />
           

            {/* Right Handles */}
              <Handle
                key={`${id}-target-right`}
                type="target"
                position={Position.Right}
                id={`${id}-target-right`}
                style={{ ...handleStyle, right: -4 }}
            />
            <Handle
                key={`${id}-source-right`}
                type="source"
                position={Position.Right}
                id={`${id}-source-right`}
                style={{ ...handleStyle, right: -4 }}
            />

            {/* Top Handles */}
                        <Handle
                key={`${id}-target-top`}
                type="target"
                position={Position.Top}
                id={`${id}-target-top`}
                style={{ ...verticalHandleStyle, top: -4 }}
            />
            <Handle
                key={`${id}-source-top`}
                type="source"
                position={Position.Top}
                id={`${id}-source-top`}
                style={{ ...verticalHandleStyle, top: -4 }}
            />

            {/* Bottom Handles */}
             <Handle
                key={`${id}-target-bottom`}
                type="target"
                position={Position.Bottom}
                id={`${id}-target-bottom`}
                style={{ ...verticalHandleStyle, top: 'auto', bottom: -4 }}
            />
            <Handle
                key={`${id}-source-bottom`}
                type="source"
                position={Position.Bottom}
                id={`${id}-source-bottom`}
                style={{ ...verticalHandleStyle, top: 'auto', bottom: -4 }}
            />
           
        </>
    );
};

export default Handles;