import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NodeConfiguration from './NodeConfiguration'

describe('NodeConfiguration Component', () => {
  let props

  beforeEach(() => {
    props = {
      config: {
        id: 'NODE_1',
        name: 'Test Node',
      },
      fieldsToRender: [
        { key: 'field1', label: 'Field 1' },
        { key: 'field2', label: 'Field 2' },
      ],
      data: { value: 'test' },
      subComponentList: ['A', 'B'],
      onConfigChange: vi.fn(),
      getInputField: vi.fn((field) => (
        <div key={field.key} data-testid={`input-${field.key}`}>
          {field.label}
        </div>
      )),
      renderSubSystemSelect: vi.fn(() => (
        <div data-testid='subsystem-select'>Subsystem</div>
      )),
      setShouldUpdateConfig: vi.fn(),
      setSelectedNodeId: vi.fn(),
      setDelete: vi.fn(),
    }
  })

  it('renders header and node details correctly', () => {
    render(<NodeConfiguration {...props} />)

    expect(screen.getByText('Configure Node')).toBeInTheDocument()
    expect(screen.getByText('Node id :')).toBeInTheDocument()
    expect(screen.getByText('NODE_1')).toBeInTheDocument()
    expect(screen.getByText('Node Name :')).toBeInTheDocument()
    expect(screen.getByText('Test Node')).toBeInTheDocument()
  })

  it('renders input fields using getInputField', () => {
    render(<NodeConfiguration {...props} />)

    expect(props.getInputField).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('input-field1')).toBeInTheDocument()
    expect(screen.getByTestId('input-field2')).toBeInTheDocument()
  })

  it('renders subsystem select using renderSubSystemSelect', () => {
    render(<NodeConfiguration {...props} />)

    expect(props.renderSubSystemSelect).toHaveBeenCalledWith(
      props.data,
      props.subComponentList,
      props.onConfigChange,
    )

    expect(screen.getByTestId('subsystem-select')).toBeInTheDocument()
  })

  it('calls setShouldUpdateConfig when Apply button is clicked', () => {
    render(<NodeConfiguration {...props} />)

    fireEvent.click(screen.getByText('Apply'))

    expect(props.setShouldUpdateConfig).toHaveBeenCalledWith(true)
  })

  it('calls setSelectedNodeId with null when Close button is clicked', () => {
    render(<NodeConfiguration {...props} />)

    fireEvent.click(screen.getByText('Close'))

    expect(props.setSelectedNodeId).toHaveBeenCalledWith(null)
  })

  it('calls setDelete when Delete button is clicked', () => {
    render(<NodeConfiguration {...props} />)

    fireEvent.click(screen.getByText('Delete'))

    expect(props.setDelete).toHaveBeenCalledWith(true)
  })

  it('renders informational note text', () => {
    render(<NodeConfiguration {...props} />)

    expect(
      screen.getByText(/All changes to the node will only be applied/i),
    ).toBeInTheDocument()
  })
})
