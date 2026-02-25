import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LegendPanel from './LegendPanel'

/* ------------------------------------------------------------------
Mock Panel from @xyflow/react
------------------------------------------------------------------- */
vi.mock('@xyflow/react', () => ({
  Panel: ({ children, position, className }) => (
    <div data-testid='panel' data-position={position} className={className}>
      {children}
    </div>
  ),
}))

/* ------------------------------------------------------------------
Mock SVG imports
------------------------------------------------------------------- */
vi.mock('../../../../../../assets/images/common/drawer.svg', () => ({
  default: 'drawer-icon',
}))
vi.mock('../../../../../../assets/images/common/Close.svg', () => ({
  default: 'close-icon',
}))
vi.mock('../../../../../../assets/images/common/FailureModeLegend.svg', () => ({
  default: 'failure-mode-legend',
}))
vi.mock('../../../../../../assets/images/common/NewFailureMode.svg', () => ({
  default: 'new-failure-mode-legend',
}))

/* ------------------------------------------------------------------
Tests
------------------------------------------------------------------- */
describe('LegendPanel', () => {
  let setShowDrawer

  beforeEach(() => {
    setShowDrawer = vi.fn()
  })

  it('renders Panel with default position', () => {
    render(<LegendPanel showDrawer={false} setShowDrawer={setShowDrawer} />)

    const panel = screen.getByTestId('panel')
    expect(panel).toBeInTheDocument()
    expect(panel.dataset.position).toBe('bottom-right')
  })

  it('renders legend content when showDrawer is false', () => {
    render(<LegendPanel showDrawer={false} setShowDrawer={setShowDrawer} />)

    expect(
      screen.getByText(
        /HOVER OVER THE RED-COLORED OBJECT TO VIEW THE FAILURE MODE/i,
      ),
    ).toBeInTheDocument()

    expect(screen.getByText(/NEW FAILURE MODE/i)).toBeInTheDocument()
  })

  it('renders drawer icon when showDrawer is true', () => {
    render(<LegendPanel showDrawer={true} setShowDrawer={setShowDrawer} />)

    const drawerImg = screen.getByRole('presentation')
    expect(drawerImg).toBeInTheDocument()
  })

  it('calls setShowDrawer with toggled value when drawer icon is clicked', () => {
    render(<LegendPanel showDrawer={true} setShowDrawer={setShowDrawer} />)

    fireEvent.click(screen.getByRole('presentation'))

    expect(setShowDrawer).toHaveBeenCalledWith(false)
  })

  it('calls setShowDrawer when close icon is clicked', () => {
    render(<LegendPanel showDrawer={false} setShowDrawer={setShowDrawer} />)

    const closeIcon = screen.getAllByRole('presentation')[0]
    fireEvent.click(closeIcon)

    expect(setShowDrawer).toHaveBeenCalledWith(true)
  })

  it('applies correct rotation class for top-center position', () => {
    render(
      <LegendPanel
        legendPosition='top-center'
        showDrawer={true}
        setShowDrawer={setShowDrawer}
      />,
    )

    const wrapper = screen.getByRole('presentation').parentElement
    expect(wrapper.className).toContain('rotate-[270deg]')
  })

  it('applies correct rotation class for bottom-center position', () => {
    render(
      <LegendPanel
        legendPosition='bottom-center'
        showDrawer={true}
        setShowDrawer={setShowDrawer}
      />,
    )

    const wrapper = screen.getByRole('presentation').parentElement
    expect(wrapper.className).toContain('rotate-90')
  })

  it('applies correct rotation class for left position', () => {
    render(
      <LegendPanel
        legendPosition='left'
        showDrawer={true}
        setShowDrawer={setShowDrawer}
      />,
    )

    const wrapper = screen.getByRole('presentation').parentElement
    expect(wrapper.className).toContain('rotate-180')
  })

  it('applies correct rotation class for right position', () => {
    render(
      <LegendPanel
        legendPosition='right'
        showDrawer={true}
        setShowDrawer={setShowDrawer}
      />,
    )

    const wrapper = screen.getByRole('presentation').parentElement
    expect(wrapper.className).toContain('rotate-0')
  })
})
