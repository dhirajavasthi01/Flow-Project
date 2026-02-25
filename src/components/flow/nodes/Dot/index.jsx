import { memo } from 'react'
import { Handle } from '@xyflow/react'
import { useAtomValue } from 'jotai'
import { showHandlesAtom } from '../../../../features/individualDetailWrapper/features/overview/store/OverviewStore'

export const Dot = ({ data, id }) => {
  const { nodeColor, dotPosition } = data
  const showHandles = useAtomValue(showHandlesAtom)

  const dotStyle = {
    width: '12px',
    height: '12px',
    backgroundColor: nodeColor,
    borderRadius: '50%',
    opacity: showHandles ? 1 : 0,
    marginTop: '5px',
  }

  const centerHandleStyle = {
    width: '6px',
    height: '6px',
    position: 'relative',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
  }
  const targetHandleStyle = {
    ...centerHandleStyle,
    top: '50%',
  }
  const sourceHandleStyle = {
    ...centerHandleStyle,
    top: '0%',
  }
  return (
    <>
      <div style={dotStyle}>
        <Handle
          key={`${id}-target-center`}
          type='target'
          id={`${id}-target-center`}
          position={dotPosition}
          style={targetHandleStyle}
        />
        <Handle
          key={`${id}-source-center`}
          type='source'
          id={`${id}-source-center`}
          position={dotPosition}
          style={sourceHandleStyle}
        />
      </div>
    </>
  )
}

export default memo(Dot)
