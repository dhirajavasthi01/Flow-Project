import { NodeResizer, useReactFlow } from '@xyflow/react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  allTagsDataAtom,
  developerModeAtom,
  failureNodeClickedAtom,
} from '../../../../features/individualDetailWrapper/features/overview/store/OverviewStore'
import {
  CompareValuesWithSymbol,
  getSafe,
  getValsBaseOnCondition,
} from '../../../../utills/nodeNameUtils/nodeNameUtils'
import { EXTRA_NODE_COLORS } from '../../../../utills/flowUtills/FlowUtills'
import Handles from '../../handles/Handles'

import {
  NodeTooltip,
  NodeTooltipContent,
  useNodeTooltip,
} from '../../nodes/nodeTooltip/NodeTooltip'
import { RotateHandle, setNodesHelperFn, TextContent } from './TextBox.function'
import {
  calculateAngle,
  calculateOptimalFontSize,
  formatTextContent,
  getRawText,
} from './TextboxConfig'

// Inner component that uses the tooltip hook - must be inside NodeTooltip context
const TextBoxContent = memo(
  ({
    containerRef,
    textRef,
    textContent,
    label,
    color,
    fontSize,
    orientation,
    numSourceHandlesRight,
    numTargetHandlesTop,
    numSourceHandlesBottom,
    numTargetHandlesLeft,
    targetHandles,
    bgColor,
    isDeveloperMode,
  }) => {
    const tooltip = useNodeTooltip()

    const handleMouseEnter = useCallback(() => {
      tooltip?.showTooltip()
    }, [tooltip])

    const handleMouseLeave = useCallback(() => {
      tooltip?.hideTooltip()
    }, [tooltip])

    return (
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          backgroundColor: bgColor || 'transparent',
          width: '100%',
          height: '100%',
          padding: '4px',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
          cursor: isDeveloperMode ? 'default' : 'pointer',
        }}
      >
        <p
          ref={textRef}
          onMouseDown={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{
            __html: textContent,
          }}
          style={{
            color: label.toLowerCase().includes('header') ? 'red' : color,
            textAlign: 'center',
            fontSize: `${fontSize}px`,
            margin: 0,
            padding: 0,
            fontWeight: 'bold',
            display: 'block',
            lineHeight: orientation === 'vertical' ? '1.1' : '1.2',
            overflow: 'hidden',
            wordBreak: 'break-all',
            whiteSpace: 'nowrap',
          }}
          className='text-uppercase'
        />

        <Handles
          numSourceHandlesRight={numSourceHandlesRight}
          numTargetHandlesTop={numTargetHandlesTop}
          numSourceHandlesBottom={numSourceHandlesBottom}
          numTargetHandlesLeft={numTargetHandlesLeft}
          targetHandles={targetHandles}
          key='textBoxNode'
        />
      </div>
    )
  },
)

TextBoxContent.displayName = 'TextBoxContent'

const useNodeRotation = (initialRotation, id, setNodes) => {
  const [rotation, setRotation] = useState(initialRotation)
  const rotationRef = useRef(initialRotation)
  const isRotating = useRef(false)
  const nodeRef = useRef(null)
  useEffect(() => {
    setRotation(initialRotation)
    rotationRef.current = initialRotation
  }, [initialRotation])
  const startRotation = useCallback(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      isRotating.current = true
      const nodeBounds = nodeRef.current.getBoundingClientRect()
      const centerX = nodeBounds.left + nodeBounds.width / 2
      const centerY = nodeBounds.top + nodeBounds.height / 2
      const onMouseMove = (moveEvent) => {
        if (!isRotating.current) return
        const newRotation = calculateAngle(
          centerX,
          centerY,
          moveEvent.clientX,
          moveEvent.clientY,
        )
        setRotation(newRotation)
        rotationRef.current = newRotation
      }
      const updateNodeRotation = (nodes, nodeId, rotationValue) => {
        return nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, rotation: rotationValue },
            }
          }
          return node
        })
      }
      const onMouseUp = () => {
        if (!isRotating.current) return
        isRotating.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        const finalRotation = rotationRef.current
        setNodes((nds) => updateNodeRotation(nds, id, finalRotation))
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [id, setNodes],
  )
  return { rotation, rotationRef, nodeRef, startRotation }
}
const useNodeDimensions = (initialWidth, initialHeight) => {
  const [currentDimensions, setCurrentDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
  })
  useEffect(() => {
    setCurrentDimensions({
      width: initialWidth,
      height: initialHeight,
    })
  }, [initialWidth, initialHeight])
  return [currentDimensions, setCurrentDimensions]
}
const useDeveloperModeSync = (isDeveloperMode, id, setNodes) => {
  useEffect(() => {
    setNodes((nodes) =>
      nodes.map((node) => {
        return getValsBaseOnCondition(node.id !== id, node, {
          ...node,
          draggable: isDeveloperMode,
          selectable: isDeveloperMode,
        })
      }),
    )
  }, [isDeveloperMode, id, setNodes])
}
const useAutoFontSize = (textRef, dimensions, label, tagData) => {
  const [fontSize, setFontSize] = useState(16)
  useLayoutEffect(() => {
    if (!textRef.current) return
    const optimalSize = calculateOptimalFontSize(
      textRef.current,
      dimensions.width,
      dimensions.height,
    )
    setFontSize(optimalSize)
  }, [dimensions.width, dimensions.height, label, tagData])
  return fontSize
}

export const TextboxNode = memo(({ data, id, selected }) => {
  const isDeveloperMode = useAtomValue(developerModeAtom)
  const allTagsDataList = useAtomValue(allTagsDataAtom)
  const setFailureNodeClicked = useSetAtom(failureNodeClickedAtom)
  const { setNodes, getNode } = useReactFlow()
  const textRef = useRef(null)
  const containerRef = useRef(null)
  const {
    width: initialWidth = 200,
    height: initialHeight = 100,
    color,
    label,
    numSourceHandlesRight,
    numSourceHandlesBottom,
    numTargetHandlesTop,
    numTargetHandlesLeft,
    linkedTag,
    template,
    targetHandles = [],
    rotation: initialRotation = 0,
    tooltipContent,
    failureModeNames,
    ttfDays = null,
  } = data
  const { rotation, rotationRef, nodeRef, startRotation } = useNodeRotation(
    initialRotation,
    id,
    setNodes,
  )
  const [currentDimensions, setCurrentDimensions] = useNodeDimensions(
    initialWidth,
    initialHeight,
  )
  useDeveloperModeSync(isDeveloperMode, id, setNodes)
  const tagData = allTagsDataList.find((x) =>
    CompareValuesWithSymbol('&&', x.tagId, x.tagId == linkedTag),
  )
  const fontSize = useAutoFontSize(textRef, currentDimensions, label, tagData)
  const onResizeEnd = (_, params) => {
    setCurrentDimensions({
      width: params.width,
      height: params.height,
    })
    setNodes((nds) =>
      setNodesHelperFn({
        nds,
        params,
        rotationRefCurrent: rotationRef.current,
        id,
      }),
    )
  }
  const { bgColor } = getSafe(() => EXTRA_NODE_COLORS[template], {})
  const { orientation = 'horizontal' } = data
  const rawText = getRawText(tagData, label)
  const textContent = formatTextContent(rawText, orientation)

  const failureModeList = getValsBaseOnCondition(
    failureModeNames?.length,
    failureModeNames,
    null,
  )

  // Get the node to check if it has a parent
  // Use parent's ID for tooltip if node has a parent, otherwise use node's own ID
  // This ensures tooltip appears at the same position as parent node when text node is a child
  const tooltipNodeId = useMemo(() => {
    const node = getNode(id)
    const parentId = node?.parentId
    if (parentId) {
      // Verify parent node exists before using its ID
      const parentNode = getNode(parentId)
      return getValsBaseOnCondition(parentNode, parentId, id)
    }
    return id
  }, [id, getNode])

  // Content that will be wrapped with NodeTooltip when not in developer mode
  const content = (
    <div
      ref={nodeRef}
      style={{
        transform: `rotate(${rotation}deg)`,
        width: currentDimensions.width,
        height: 'fit-content',
        position: 'relative',
        cursor: 'grab',
      }}
    >
      {selected && isDeveloperMode && (
        <RotateHandle onMouseDown={startRotation} />
      )}
      <NodeResizer
        isVisible={getValsBaseOnCondition(selected, isDeveloperMode, null)}
        minWidth={20}
        minHeight={20}
        onResizeEnd={onResizeEnd}
      />
      {getValsBaseOnCondition(
        isDeveloperMode,
        <div
          ref={containerRef}
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            backgroundColor: getSafe(() => bgColor, 'transparent'),
            width: '100%',
            height: '100%',
            padding: '4px 0px',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            lineHeight: getValsBaseOnCondition(
              orientation === 'vertical',
              '1.1',
              '1.2',
            ),
            cursor: getValsBaseOnCondition(
              CompareValuesWithSymbol(
                '||',
                isDeveloperMode,
                setFailureNodeClicked,
              ),
              'default',
              'pointer',
            ),
            wordBreak: 'break-all',
            whiteSpace: 'nowrap',
          }}
        >
          <TextContent
            textRef={textRef}
            content={textContent}
            color={color}
            label={label}
            fontSize={fontSize}
          />
          <Handles
            numSourceHandlesRight={numSourceHandlesRight}
            numTargetHandlesTop={numTargetHandlesTop}
            numSourceHandlesBottom={numSourceHandlesBottom}
            numTargetHandlesLeft={numTargetHandlesLeft}
            targetHandles={targetHandles}
            key='textBoxNode'
          />
        </div>,
        <TextBoxContent
          containerRef={containerRef}
          textRef={textRef}
          textContent={textContent}
          label={label}
          color={color}
          fontSize={fontSize}
          orientation={orientation}
          numSourceHandlesRight={numSourceHandlesRight}
          numTargetHandlesTop={numTargetHandlesTop}
          numSourceHandlesBottom={numSourceHandlesBottom}
          numTargetHandlesLeft={numTargetHandlesLeft}
          targetHandles={targetHandles}
          bgColor={bgColor}
          isDeveloperMode={isDeveloperMode}
        />,
      )}
    </div>
  )
  if (!isDeveloperMode) {
    return (
      <NodeTooltip nodeId={tooltipNodeId}>
        <NodeTooltipContent id={tooltipNodeId} nodeId={tooltipNodeId}>
          {getValsBaseOnCondition(
            failureModeList?.length,
            <div className='p-[.7vmin] flex flex-col uppercase'>
              <div className='border-b-[.1vmin] border-b-primary_gray_2 text-center'>
                <span className='text-12 font-sabic_text_bold'>
                  {getSafe(() => tooltipContent || '-')}
                </span>
              </div>

              <div className='flex flex-col uppercase'>
                <div className='flex text-13 pt-1 gap-1 items-start'>
                  <div className='text-12 font-sabic_text_bold'>
                    Estimated TTF :
                  </div>
                  {getValsBaseOnCondition(
                    CompareValuesWithSymbol(
                      '&&',
                      ttfDays != undefined,
                      ttfDays != null,
                    ),
                    <div>
                      {ttfDays}{' '}
                      {getValsBaseOnCondition(ttfDays > 1, 'Days', 'Day')}
                    </div>,
                    <div>-</div>,
                  )}
                </div>

                <div className='flex flex-col text-13 pt-[1vmin] gap-[0.5vmin] items-start'>
                  <div className='text-12 font-sabic_text_bold gap-1'>
                    Failure Mode
                    {getValsBaseOnCondition(
                      failureModeList?.length > 1,
                      's',
                      '',
                    )}{' '}
                    : &nbsp;
                  </div>

                  <ul className='flex flex-col gap-[0.5vmin] px-[0vmin] list-disc ml-[2vmin] mt-[-1vmin]'>
                    {failureModeList?.map((item) => (
                      <li
                        key={`${item}-flow`}
                        className='[&::marker]:text-[2.5vmin] [&::marker]:font-bold'
                      >
                        <span className='max-w-[250px] text-13 whitespace-normal break-words inline-block align-top'>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>,
            getValsBaseOnCondition(
              CompareValuesWithSymbol('||', tooltipContent, label),
              <div className='p-[0_1vmin] text-center'>
                <span className='text-14'>
                  {getSafe(() => tooltipContent, label)}
                </span>
              </div>,
              null,
            ),
          )}
        </NodeTooltipContent>
        {content}
      </NodeTooltip>
    )
  }

  return content
})
