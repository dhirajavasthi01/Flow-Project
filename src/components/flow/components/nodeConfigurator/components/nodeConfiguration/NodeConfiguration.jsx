import React, { useState } from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

/**
 * NodeConfigurationForm Component
 * Renders the form for configuring a selected node
 *
 * @param {Object} props
 * @param {Object} props.config - The node configuration object
 * @param {Array} props.fieldsToRender - Array of field configurations to render
 * @param {Object} props.data - The node data object
 * @param {Function} props.getInputField - Function to render input fields
 * @param {Function} props.renderSubSystemSelect - Function to render subsystem select
 * @param {Function} props.setShouldUpdateConfig - Function to trigger config update
 * @param {Function} props.setSelectedNodeId - Function to clear selected node
 * @param {Function} props.setDelete - Function to trigger node deletion
 * @param {Function} props.onDimensionChange - Function to update node width/height in config (dimension, value) => void
 */
const NodeConfiguration = ({
  config,
  fieldsToRender,
  data,
  getInputField,
  renderSubSystemSelect,
  setShouldUpdateConfig,
  setSelectedNodeId,
  setDelete,
  onConfigChange,
  onDimensionChange,
  subComponentList,
}) => {
  const currentWidth =
    config?.data?.width ?? config?.width ?? config?.style?.width ?? ''
  const currentHeight =
    config?.data?.height ?? config?.height ?? config?.style?.height ?? ''

  const [copiedField, setCopiedField] = useState(null)

  const handleCopyDimension = (dimension, value) => {
    const str = value !== '' && value != null ? String(value) : ''
    if (!str) return
    navigator.clipboard?.writeText(str).then(() => {
      setCopiedField(dimension)
      setTimeout(() => setCopiedField(null), 1500)
    })
  }

  return (
    <div className='h-100'>
      <div className='flex justify-between items-center bg-primary_blue_bg p-[1.5vmin] border-b-[0.025vmin] border-b-primary_gray_3'>
        <h3 className='text-14 text-primary_dark_blue uppercase font-sabic_text_bold'>
          Configure Node
        </h3>
      </div>

      <div className='p-[1vmin_1.5vmin]'>
        <p className='text-14 text-primary_gray font-sabic_text_bold uppercase mb-1'>
          Node id :{' '}
          <span className='text-14 font-sabic_text_regular text-primary_gray_1'>
            {config.id}
          </span>
        </p>
        <p className='text-14 text-primary_gray font-sabic_text_bold uppercase '>
          Node Name :{' '}
          <span className='text-14 font-sabic_text_regular text-primary_gray_1'>
            {config.name}
          </span>
        </p>
      </div>

      <div className='p-[1vmin_1.5vmin] flex flex-col gap-[1vmin]'>
        <div className='flex flex-nowrap items-center gap-[0.5vmin]'>
          <label className='text-14 text-primary_gray font-sabic_text_bold whitespace-nowrap uppercase'>
            Width :
          </label>
          <input
            className='text-14 focus:outline-[0.2vmin] focus:outline-primary_blue p-[0.5vmin_0.5vmin] flex-grow border border-primary_gray_2 rounded-[0.4vmin]'
            type='text'
            inputMode='decimal'
            value={currentWidth}
            onChange={(e) => onDimensionChange('width', e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData?.getData('text')?.trim()
              if (text && !Number.isNaN(Number(text)) && Number(text) > 0) {
                e.preventDefault()
                setTimeout(() => onDimensionChange('width', text), 0)
              }
            }}
            onBlur={(e) => {
              const v = e.target.value
              if (v !== '' && !Number.isNaN(Number(v)) && Number(v) > 0) {
                onDimensionChange('width', v)
              }
            }}
          />
          <button
            type='button'
            className='flex items-center justify-center p-[0.4vmin] rounded-[0.3vmin] border border-primary_gray_2 hover:bg-primary_gray_3 focus:outline-none'
            onClick={() => handleCopyDimension('width', currentWidth)}
            title='Copy width'
            aria-label='Copy width'
          >
            <ContentCopyIcon sx={{ fontSize: '2vmin' }} />
          </button>
          {copiedField === 'width' && (
            <span className='text-12 text-primary_blue whitespace-nowrap'>
              Copied!
            </span>
          )}
        </div>
        <div className='flex flex-nowrap items-center gap-[0.5vmin]'>
          <label className='text-14 text-primary_gray font-sabic_text_bold whitespace-nowrap uppercase'>
            Height :
          </label>
          <input
            className='text-14 focus:outline-[0.2vmin] focus:outline-primary_blue p-[0.5vmin_0.5vmin] flex-grow border border-primary_gray_2 rounded-[0.4vmin]'
            type='text'
            inputMode='decimal'
            value={currentHeight}
            onChange={(e) => onDimensionChange('height', e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData?.getData('text')?.trim()
              if (text && !Number.isNaN(Number(text)) && Number(text) > 0) {
                e.preventDefault()
                setTimeout(() => onDimensionChange('height', text), 0)
              }
            }}
            onBlur={(e) => {
              const v = e.target.value
              if (v !== '' && !Number.isNaN(Number(v)) && Number(v) > 0) {
                onDimensionChange('height', v)
              }
            }}
          />
          <button
            type='button'
            className='flex items-center justify-center p-[0.4vmin] rounded-[0.3vmin] border border-primary_gray_2 hover:bg-primary_gray_3 focus:outline-none'
            onClick={() => handleCopyDimension('height', currentHeight)}
            title='Copy height'
            aria-label='Copy height'
          >
            <ContentCopyIcon sx={{ fontSize: '2vmin' }} />
          </button>
          {copiedField === 'height' && (
            <span className='text-12 text-primary_blue whitespace-nowrap'>
              Copied!
            </span>
          )}
        </div>
      </div>
      <>
        {fieldsToRender.map((field) => getInputField(field, data))}

        {renderSubSystemSelect(data, subComponentList, onConfigChange)}

        <div className='flex justify-around items-center mt-[1vmin] flex-wrap gap-[1vmin]'>
          <button
            className={`
                                 bg-primary_blue hover:bg-primary_blue_hover
                                  text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase
                                  `}
            onClick={() => {
              setShouldUpdateConfig(true)
            }}
          >
            Apply
          </button>
          <button
            className={` bg-primary_black hover:bg-primary_gray
                                  text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}
            onClick={() => {
              setSelectedNodeId(null)
            }}
          >
            Close
          </button>
          <button
            className={` bg-primary_orange hover:bg-primary_red_60
                                  text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}
            onClick={() => {
              setDelete(true)
            }}
          >
            Delete
          </button>
        </div>

        <div className='text-14 text_primary_gray_3 uppercase p-[1.5vmin_1.5vmin]'>
          <b className=''>Note : </b> All changes to the node will only be
          applied upon clicking Apply button
        </div>
      </>
    </div>
  )
}

export default NodeConfiguration
