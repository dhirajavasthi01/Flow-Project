import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
vi.mock('@xyflow/react', () => ({
  NodeResizer: ({ isVisible, minWidth, minHeight, onResizeEnd }) => (
    <div
      data-testid='node-resizer'
      data-visible={isVisible}
      data-minwidth={minWidth}
      data-minheight={minHeight}
      onClick={() => onResizeEnd && onResizeEnd('fake-event')}
    ></div>
  ),
}))
vi.mock('ADFPUIVisuals/SvgNode', () => ({
  default: (props) => (
    <div data-testid='svg-node' data-props={JSON.stringify(props)}></div>
  ),
}))
vi.mock('./handles/Handles', () => ({
  default: () => <div data-testid='handles-component'></div>,
}))
vi.mock('./SvgMap', () => ({
  svgMap: {
    'test-node': 'M10 10 H 90 V 90 H 10 Z',
    'no-path-node': null,
  },
}))
vi.mock('../../hooks/useNodeResize/useNodeResize', () => ({
  useNodeResize: vi.fn(),
}))
import { useNodeResize } from '../../hooks/useNodeResize/useNodeResize'
import BaseSvgNode from './BaseSvgNode'
describe('BaseSvgNode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  const defaultProps = {
    id: 'node-123',
    type: 'test-type',
    nodeType: 'test-node',
    data: { label: 'Node Data' },
    selected: true,
    isDeveloperMode: true,
    isSelected: true,
    isHighlighted: false,
    svgNodeProps: {
      defaultNodeColor: '#abcdef',
      defaultStrokeColor: '#112233',
      customProp: 'custom',
    },
    resizeOptions: { minWidth: 50, minHeight: 60 },
  }
  it('shows NodeResizer only when selected & isDeveloperMode = true', () => {
    vi.mocked(useNodeResize).mockReturnValue(() => {})
    const { rerender } = render(<BaseSvgNode {...defaultProps} />)
    const resizer = screen.getByTestId('node-resizer')
    expect(resizer.dataset.visible).toBe('true')
    rerender(
      <BaseSvgNode {...defaultProps} selected={false} isDeveloperMode={true} />,
    )
    expect(screen.getByTestId('node-resizer').dataset.visible).toBe('false')
    rerender(
      <BaseSvgNode {...defaultProps} selected={true} isDeveloperMode={false} />,
    )
    expect(screen.getByTestId('node-resizer').dataset.visible).toBe('false')
  })
  it('sets minWidth and minHeight from resizeOptions', () => {
    vi.mocked(useNodeResize).mockReturnValue(() => {})
    render(<BaseSvgNode {...defaultProps} />)
    const resizer = screen.getByTestId('node-resizer')
    expect(resizer.dataset.minwidth).toBe('50')
    expect(resizer.dataset.minheight).toBe('60')
  })
  it('passes correct svgPath from svgMap to SvgNode', () => {
    vi.mocked(useNodeResize).mockReturnValue(() => {})
    render(<BaseSvgNode {...defaultProps} />)
  })
  it('passes null svgPath if svgMap value is not a string', () => {
    vi.mocked(useNodeResize).mockReturnValue(() => {})
    render(<BaseSvgNode {...defaultProps} nodeType='no-path-node' />)
  })
  it('passes expected props to SvgNode', () => {
    vi.mocked(useNodeResize).mockReturnValue(() => {})
    render(<BaseSvgNode {...defaultProps} />)
  })
  it('uses default minWidth & minHeight when resizeOptions is not provided', () => {
    vi.mocked(useNodeResize).mockReturnValue(() => {})
    render(<BaseSvgNode {...defaultProps} resizeOptions={undefined} />)
    const resizer = screen.getByTestId('node-resizer')
    expect(resizer.dataset.minwidth).toBe('10')
    expect(resizer.dataset.minheight).toBe('20')
  })
})
