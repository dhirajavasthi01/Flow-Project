import DrawerIcon from '@mui/icons-material/Close'
import CloseIcon from '@mui/icons-material/Close'
import FailureModeLegend from '@mui/icons-material/Close'
import NewFailureModeLegend from '@mui/icons-material/Square'
import CameraIcon from '@mui/icons-material/Close'
import { useParams } from 'react-router-dom'
import { getNodesBounds, useReactFlow, Panel } from '@xyflow/react'
import { useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Tooltip } from '@mui/material'

// src\assets\images\sidebar\Camera.svg
/**
 * Helper function to get drawer rotation classes based on legend position
 */
const getDrawerRotationClass = (legendPosition) => {
  if (!legendPosition) return ''
  if (legendPosition.includes('top-center'))
    return 'rotate-[270deg] mt-[-2vmin]'
  if (legendPosition.includes('bottom-center')) return 'rotate-90 mb-[-2vmin]'
  if (legendPosition.includes('left')) return 'rotate-180'
  return ''
}

/**
 * LegendPanel Component
 * Renders the failure mode legend panel with drawer toggle
 */
const LegendPanel = ({
  legendPosition = 'bottom-right',
  showDrawer = false,
  setShowDrawer,
}) => {
  const params = useParams()
  const { getNodes } = useReactFlow()
  const handleDrawerToggle = (e) => {
    e?.stopPropagation()
    setShowDrawer(!showDrawer)
  }
  const handleDownloadDiagram = useCallback(async () => {
    const nodes = getNodes()
    const viewportElement = document.querySelector('.react-flow__viewport')
    if (!viewportElement) return
    const bounds = getNodesBounds(nodes)
    const padding = 100
    const imageWidth = Math.ceil(bounds.width + padding * 2)
    const imageHeight = Math.ceil(bounds.height + padding * 2)
    const options = {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`,
      },
      copyStyles: true,
      skipAutoScale: true,
      cacheBust: true,
      pixelRatio: 1,
    }
    try {
      const dataUrl = await toPng(viewportElement, options)
      const link = document.createElement('a')
      link.download = `${params?.plant || 'diagram'}_full_overview.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [getNodes, getNodesBounds, params])

  return (
    <>
      <Panel position='top-right'>
        <Tooltip
          placement='left'
          arrow
          title={'Download Diagram'}
          slotProps={{
            tooltip: {
              className: 'customTooltip',
            },
          }}
          PopperProps={{
            disablePortal: true,
            popperOptions: {
              modifiers: [
                { name: 'preventOverflow', options: { boundary: 'window' } },
              ],
            },
          }}
        >
          <button
            className='bg-gray-200 p-1 cursor-pointer'
            onClick={handleDownloadDiagram}
          >
            <img
              alt='CameraIcon'
              className='icon-img cursor-pointer'
              src={CameraIcon}
              style={{
                width: '2.1vmin',
                height: '2.1vmin',
              }}
            />
          </button>
        </Tooltip>
      </Panel>
      <Panel
        position={legendPosition}
        className='p-0 m-0 flex flex-col items-end gap-2'
      >
        {showDrawer ? (
          <div
            className={`my-1 ${getDrawerRotationClass(legendPosition)}`}
            onClick={handleDrawerToggle}
          >
            <img src={DrawerIcon} alt='' className='cursor-pointer' />
          </div>
        ) : (
          <div
            className={`w-fit m-2 ${
              legendPosition?.includes('bottom-right') ? 'mr-[7vmin]' : ''
            }`}
          >
            <div className='flex justify-end' onClick={handleDrawerToggle}>
              <img
                src={CloseIcon}
                className='bg-gray-200 rounded-full w-2 cursor-pointer'
                alt=''
              />
            </div>
            <div className='flex items-center gap-[.5vmin] uppercase p-[.5vmin_1vmin] text-12 bg-primary_yellow_bg font-medium'>
              <div className='h-[1.8vmin] w-[1.8vmin]'>
                <img src={FailureModeLegend} alt='' />
              </div>
              <p className='text-primary_gray mt-[.4vmin] font-sabic_text_bold'>
                HOVER OVER THE RED-COLORED OBJECT TO VIEW THE FAILURE MODE
              </p>
            </div>
            <div className='flex items-center gap-[.5vmin] uppercase p-[.0vmin_1vmin] text-12 bg-primary_yellow_bg font-medium'>
              <div className=' w-[2.8vmin] blink node-blink'>
                <img
                  src={NewFailureModeLegend}
                  className='ml-[-.45vmin]'
                  alt=''
                />
              </div>
              <p className='text-primary_gray mt-[.4vmin] font-sabic_text_bold ml-[-.9vmin]'>
                NEW FAILURE MODE
              </p>
            </div>
          </div>
        )}
      </Panel>
    </>
  )
}

export default LegendPanel
