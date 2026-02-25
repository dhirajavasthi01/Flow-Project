import DOMPurify from 'dompurify'

export const TextContent = ({ textRef, content, color, label, fontSize }) => (
  <p
    ref={textRef}
    onMouseDown={(e) => e.stopPropagation()}
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    style={{
      color: label.toLowerCase().includes('header') ? 'red' : color,
      textAlign: 'center',
      fontSize: `${fontSize}px`,
      margin: 0,
      padding: 0,
      fontWeight: 'bold',
      lineHeight: '1.2',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    className='text-uppercase'
  />
)

export const RotateHandle = ({ onMouseDown }) => (
  <div
    className='rotate-handle nodrag'
    onMouseDown={onMouseDown}
    style={{
      position: 'absolute',
      top: -30,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 20,
      height: 20,
      borderRadius: '50%',
      backgroundColor: '#0098cfff',
      cursor: 'grab',
      zIndex: 10,
      border: '2px solid white',
    }}
  >
    <div
      style={{
        color: 'white',
        fontSize: '14px',
        textAlign: 'center',
        lineHeight: '18px',
      }}
    >
      ↻
    </div>
  </div>
)

export const setNodesHelperFn = ({ nds, params, rotationRefCurrent, id }) => {
  return nds?.map((node) => {
    if (node.id === id) {
      return {
        ...node,
        data: {
          ...node.data,
          width: params.width,
          height: params.height,
          rotation: rotationRefCurrent,
        },
      }
    }
    return node
  })
}
