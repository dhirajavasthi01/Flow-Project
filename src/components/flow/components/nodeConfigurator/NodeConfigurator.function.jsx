import React, { Suspense, useState } from 'react'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { normalizeSubComponentAssetIds } from '../../../../utills/flowUtills/FlowUtills'
import MultiSelectV2 from '../../../multiSelect/MultiSelect'

const ColorInputWithCopy = ({ name, value, onChange, label }) => {
  const [copied, setCopied] = useState(false)
  const displayValue = value || ''
  const handleCopy = () => {
    if (displayValue) {
      navigator.clipboard?.writeText(displayValue).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
    }
  }
  const handleTextChange = (e) => {
    onChange({
      target: {
        name,
        value: e.target.value,
        type: 'color',
        checked: false,
      },
    })
  }
  return (
    <div className='flex flex-wrap items-center gap-[0.5vmin]'>
      {label && (
        <label className='text-14 text-primary_gray uppercase'>{label} :</label>
      )}
      <input
        type='color'
        name={name}
        value={displayValue}
        onChange={onChange}
        className='form-control text-14 h-[2.5vmin] w-[3vmin] min-w-[3vmin] cursor-pointer border border-primary_gray_2 rounded-[0.3vmin]'
      />
      <input
        type='text'
        value={displayValue}
        onChange={handleTextChange}
        className='text-14 focus:outline-[0.2vmin] focus:outline-primary_blue p-[0.4vmin_0.5vmin] flex-grow min-w-[8vmin] border border-primary_gray_2 rounded-[0.4vmin]'
        placeholder='#000000'
      />
      <button
        type='button'
        className='flex items-center justify-center p-[0.4vmin] rounded-[0.3vmin] border border-primary_gray_2 hover:bg-primary_gray_3 focus:outline-none'
        onClick={handleCopy}
        title={`Copy ${label || name}`}
        aria-label={`Copy ${label || name}`}
      >
        <ContentCopyIcon sx={{ fontSize: '2vmin' }} />
      </button>
      {copied && (
        <span className='text-12 text-primary_blue whitespace-nowrap'>
          Copied!
        </span>
      )}
    </div>
  )
}

export const renderTextField = (field, data, onConfigChange) => (
  <div
    key={field.name}
    className='flex flex-nowrap p-[0.5vmin_1.5vmin] items-center'
  >
    <label className='text-14 text-primary_gray font-sabic_text_bold whitespace-nowrap uppercase'>
      {field.label} :
    </label>
    <input
      className='text-14 focus:outline-[0.2vmin] focus:outline-primary_blue p-[0.5vmin_0.5vmin] flex-grow ml-[0.5vmin] border border-primary_gray_2 rounded-[.4vmin]'
      type='text'
      name={field.name}
      value={data?.[field.name] || ''}
      onChange={onConfigChange}
    />
  </div>
)

export const renderNumberField = (field, data, onConfigChange) => (
  <div key={field.name} className='mb-2 border border-red-500'>
    <label className='text-24 text-primary_gray font-sabic_text_bold uppercase'>
      {field.label} :
    </label>
    <input
      className='form-control text-14-regular'
      type='number'
      name={field.name}
      value={data?.[field.name] || ''}
      min={field.min}
      onChange={onConfigChange}
    />
  </div>
)

export const renderColorField = (field, data, onConfigChange) => (
  <div
    key={field.name}
    className='flex items-center p-[0vmin_1.5vmin] gap-[0.5vmin]'
  >
    <ColorInputWithCopy
      name={field.name}
      value={data?.[field.name] || ''}
      onChange={onConfigChange}
      label={field.label}
    />
  </div>
)

const handleColorChange = (
  e,
  counterpartName,
  counterpartValue,
  onConfigChange,
) => {
  onConfigChange(e)
  const syntheticEvent = {
    target: {
      name: counterpartName,
      value: counterpartValue,
      type: 'color',
      checked: false,
    },
  }
  onConfigChange(syntheticEvent)
}

export const renderGradientColorField = (
  field,
  data,
  onConfigChange,
  extractedColors,
) => {
  const colors = [
    {
      name: 'gradientStart',
      value: data.gradientStart ?? extractedColors?.gradientStart,
      counterpart: 'gradientEnd',
    },
    {
      name: 'gradientEnd',
      value: data.gradientEnd ?? extractedColors?.gradientEnd,
      counterpart: 'gradientStart',
    },
  ]

  return (
    <div key={field.name} className='text-14 p-[1vmin_1.5vmin]'>
      <label className='text-14 text-primary_gray uppercase mb-2'>
        <strong>{field.label} :</strong>
      </label>
      <div className='flex flex-wrap gap-[1vmin]'>
        {colors.map(({ name, value, counterpart }) => (
          <div key={name} className='flex items-center gap-[0.5vmin]'>
            <ColorInputWithCopy
              name={name}
              value={value ?? ''}
              onChange={(e) =>
                handleColorChange(
                  e,
                  counterpart,
                  data[counterpart] ?? extractedColors?.[counterpart],
                  onConfigChange,
                )
              }
              label={name}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export const renderStrokeColorField = (field, data, onConfigChange) => (
  <div key={field.name} className='text-14 p-[1vmin_1.5vmin]'>
    <ColorInputWithCopy
      name='strokeColor'
      value={data?.strokeColor || ''}
      onChange={onConfigChange}
      label={field.label}
    />
  </div>
)

export const renderSubSystemSelect = (
  data,
  subComponentList,
  onConfigChange,
) => {
  const currentValue = data?.subComponentAssetId
  const selectedIds = normalizeSubComponentAssetIds(currentValue)

  const multiSelectData = subComponentList.map((subComponent) => ({
    tag_name: String(subComponent.assetID),
    display_name: subComponent.assetName,
  }))

  const initialValues = selectedIds
    .map((id) => {
      const subComponent = subComponentList.find(
        (sc) => String(sc.assetID) === String(id),
      )
      return subComponent
        ? {
            tag_name: String(subComponent.assetID),
            display_name: subComponent.assetName,
          }
        : null
    })
    .filter(Boolean)

  const handleMultiSelectChange = (selectedTags) => {
    const selectedIds = selectedTags
      ? selectedTags.map((tag) => tag.tag_name)
      : []

    const syntheticEvent = {
      target: {
        name: 'subComponentAssetId',
        value: selectedIds,
        type: 'multi-select',
        checked: false,
      },
    }
    onConfigChange(syntheticEvent)
  }

  return (
    <div
      key='sub-system-select'
      className='p-[1vmin_1.5vmin] flex items-center gap-[1vmin]'
    >
      <label className='text-nowrap mt-[.5vmin] text-14 text-primary_gray font-sabic_text_bold uppercase'>
        Asset :
      </label>
      <div style={{ borderRadius: '0.3vmin', width: '100%' }}>
        <Suspense fallback={null}>
          <MultiSelectV2
            data={multiSelectData}
            onChange={handleMultiSelectChange}
            initialValues={initialValues}
            shouldUpdateSelected={false}
            isFullWidth={true}
          />
        </Suspense>
      </div>
    </div>
  )
}
