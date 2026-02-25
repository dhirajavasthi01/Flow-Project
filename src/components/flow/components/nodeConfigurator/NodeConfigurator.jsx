import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  deleteAtom,
  nodeConfigAtom,
  selectedEdgeIdAtom,
  selectedNodeIdAtom,
  selectedPageAtom,
  updateConfigAtom,
  subComponentListAtom,
} from '../../../../features/individualDetailWrapper/features/overview/store/OverviewStore'
import { nodeTypesConfig } from '../../utils/nodeEdgeType/NodeEdgeType'
import {
  extractColorsFromSvg,
  text_box_resources,
} from '../../../../utills/flowUtills/FlowUtills'
import { isSpecialNode } from '../../utils/nodeSpecialHandling/NodeSpecialHandling'
import { svgMap } from '../svgMap/SvgMap'
import {
  renderColorField,
  renderGradientColorField,
  renderNumberField,
  renderStrokeColorField,
  renderSubSystemSelect,
  renderTextField,
} from './NodeConfigurator.function'
import NodeConfiguration from './components/nodeConfiguration/NodeConfiguration'
import EdgeConfiguration from './components/edgeConfiguration/EdgeConfiguration'

const NodeConfigurator = () => {
  const [config, setConfig] = useAtom(nodeConfigAtom)
  const setShouldUpdateConfig = useSetAtom(updateConfigAtom)
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)
  const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom)
  const setDelete = useSetAtom(deleteAtom)
  const selectedPage = useAtomValue(selectedPageAtom)
  const subComponentList = useAtomValue(subComponentListAtom)
  const [extractedColors, setExtractedColors] = useState(null)

  useEffect(() => {
    setConfig(null)
    setSelectedEdgeId(null)
    setSelectedNodeId(null)
  }, [selectedPage, setConfig, setSelectedEdgeId, setSelectedNodeId])

  const updateConfigWithColors = (colors, prevConfig) => {
    if (!prevConfig) return prevConfig
    const hasGradientStart = prevConfig.data?.gradientStart
    const hasGradientEnd = prevConfig.data?.gradientEnd
    if (hasGradientStart && hasGradientEnd) return prevConfig
    const updatedConfig = {
      ...prevConfig,
      data: {
        ...prevConfig.data,
        gradientStart: hasGradientStart || colors.gradientStart,
        gradientEnd: hasGradientEnd || colors.gradientEnd,
      },
    }
    const isSelectedNode = selectedNodeId && prevConfig.id === selectedNodeId
    if (isSelectedNode) {
      setTimeout(() => setShouldUpdateConfig(true), 0)
    }
    return updatedConfig
  }

  const handleColorExtraction = async (svgPath) => {
    setExtractedColors(null)
    const isSpecial = await isSpecialNode(config?.nodeType, svgPath)
    if (isSpecial) {
      // For special nodes, ensure colors are undefined to preserve original SVG colors
      setConfig((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          data: {
            ...prev.data,
            isSpecialNode: true,
            nodeColor: undefined,
            strokeColor: undefined,
          },
        }
      })
      return
    }

    try {
      const colors = await extractColorsFromSvg(svgPath)
      setExtractedColors(colors)
      if (colors.gradientStart && colors.gradientEnd) {
        setConfig((prev) => updateConfigWithColors(colors, prev))
      }
      // Set default colors for non-special nodes if they don't have colors yet
      setConfig((prev) => {
        if (!prev) return prev
        const hasNodeColor = prev.data?.nodeColor !== undefined
        const hasStrokeColor = prev.data?.strokeColor !== undefined

        if (!hasNodeColor || !hasStrokeColor) {
          return {
            ...prev,
            data: {
              ...prev.data,
              nodeColor: hasNodeColor ? prev.data.nodeColor : '#d3d3d3',
              strokeColor: hasStrokeColor ? prev.data.strokeColor : '#000000',
            },
          }
        }
        return prev
      })
    } catch (error) {
      console.error('Error extracting colors:', error)
    }
  }

  useEffect(() => {
    const svgPath = config?.nodeType ? svgMap[config.nodeType] : null
    if (!svgPath || !config) {
      setExtractedColors(null)
      return
    }
    handleColorExtraction(svgPath)
  }, [
    config?.nodeType,
    config?.id,
    selectedNodeId,
    setConfig,
    setShouldUpdateConfig,
  ])

  const onConfigChange = (event) => {
    const { name, value, type, checked } = event.target
    if (type === 'multi-select') {
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]: value,
        },
      }))
    } else if (name === 'template') {
      const selectedData = text_box_resources.find((x) => x.id === value)
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]: value,
          backgroundColor: selectedData.bgColor,
          borderColor: selectedData.borderColor,
        },
      }))
    } else if (type === 'checkbox') {
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]: checked,
        },
      }))
    } else {
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]:
            name === 'numSourceHandles' ||
            name === 'numTargetHandles' ||
            name === 'numSourceHandlesRight' ||
            name === 'numTargetHandlesTop' ||
            name === 'numSourceHandlesBottom' ||
            name === 'numTargetHandlesLeft'
              ? parseInt(value)
              : value,
        },
      }))
    }
  }

  const onEdgeConfigChange = (event) => {
    const { name, value } = event.target
    setConfig((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      }
      if (name === 'type') {
        const hasArrow =
          value === 'flowingPipeStraightArrow' ||
          value === 'flowingPipeDottedArrow'
        if (hasArrow) {
          const existingSize = prev.markerEnd?.width || 20
          updated.markerEnd = {
            type: 'arrowclosed',
            width: existingSize,
            height: existingSize,
            color: prev.style?.stroke || prev.markerEnd?.color || '#000',
          }
        } else {
          updated.markerEnd = undefined
        }
      }
      return updated
    })
  }

  const getOptionsList = (key) => {
    if (key === 'subComponentAssetId') {
      return [
        { id: null, name: 'Select Sub Component' },
        ...subComponentList.map((x) => ({ id: x.assetID, name: x.assetName })),
      ]
    }
    return []
  }

  const getData = (selectedEdgeId, config) => {
    if (selectedEdgeId) {
      return config
    } else {
      return config?.data
    }
  }

  const renderSelectField = (field, data) => {
    const options = field.customOptionsKey
      ? getOptionsList(field.customOptionsKey)
      : field.options || []
    return (
      <div key={field.name} className='p-[1vmin_1.5vmin] flex flex-col'>
        <label className='text-14 uppercase mb-1'>{field.label} :</label>
        <select
          className='form-select border border-primary_gray_2 p-[.7vmin_.5vmin] outline-primary_blue'
          name={field.name}
          value={data?.[field.name] || ''}
          onChange={onConfigChange}
          style={{
            fontSize: '1.4vmin',
            width: '100%',
            borderRadius: '.3vmin',
          }}
        >
          {options.map((option, index) => {
            const val = option.id !== undefined ? option.id : option.value
            const label = option.name !== undefined ? option.name : option.label
            return (
              <option key={`${field.name}-${val}-${index}`} value={val}>
                {label}
              </option>
            )
          })}
        </select>
      </div>
    )
  }

  const getInputField = (field, data) => {
    // Check field.name first for special cases
    if (field.name === 'strokeColor') {
      return renderStrokeColorField(field, data)
    }
    // Route by field.type
    switch (field.type) {
      case 'number':
        return renderNumberField(field, data, onConfigChange)
      case 'text':
        return renderTextField(field, data, onConfigChange)
      case 'color':
        return renderColorField(field, data, onConfigChange)
      case 'gradientColor':
        return renderGradientColorField(
          field,
          data,
          onConfigChange,
          extractedColors,
        )
      case 'select':
        return renderSelectField(field, data)
      default:
        return renderSelectField(field, data)
    }
  }

  const data = getData(selectedEdgeId, config)
  const fieldsToRender = nodeTypesConfig[config?.nodeType]?.fields || []

  if (!selectedNodeId && !selectedEdgeId) {
    return (
      <div className='h-100'>
        <div className='flex justify-between items-center bg-primary_blue_bg p-[1.5vmin]  border-b-[0.025vmin] border-b-primary_gray_3'>
          <h3 className='text-14 text-primary_dark_blue uppercase font-sabic_text_bold'>
            Configure Node
          </h3>
        </div>
        <p className='text-16  p-[2vmin_1.5vmin] uppercase'>
          Please select a node/edge to configure
        </p>
      </div>
    )
  }

  if (selectedNodeId) {
    return (
      <NodeConfiguration
        config={config}
        fieldsToRender={fieldsToRender}
        data={data}
        getInputField={getInputField}
        renderSubSystemSelect={renderSubSystemSelect}
        setShouldUpdateConfig={setShouldUpdateConfig}
        setSelectedNodeId={setSelectedNodeId}
        setDelete={setDelete}
        onConfigChange={onConfigChange}
        subComponentList={subComponentList}
      />
    )
  }
  return (
    <EdgeConfiguration
      config={config}
      data={data}
      onEdgeConfigChange={onEdgeConfigChange}
      setConfig={setConfig}
      setShouldUpdateConfig={setShouldUpdateConfig}
      setSelectedEdgeId={setSelectedEdgeId}
      setDelete={setDelete}
    />
  )
}

export default NodeConfigurator
