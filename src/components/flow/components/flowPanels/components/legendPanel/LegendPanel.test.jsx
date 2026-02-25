import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LegendPanel from './LegendPanel'
import React from 'react'
import { toPng } from 'html-to-image'
// ---------------- MOCKS ----------------

// dynamic mock for useParams
let mockPlant = 'testPlant'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ plant: mockPlant }),
}))

// Mock @xyflow/react
const mockGetNodes = vi.fn()

vi.mock('@xyflow/react', async () => {
  return {
    Panel: ({ children }) => <div>{children}</div>,
    useReactFlow: () => ({
      getNodes: mockGetNodes,
    }),
    getNodesBounds: vi.fn(() => ({
      x: 0,
      y: 0,
      width: 500,
      height: 400,
    })),
  }
})

vi.mock('html-to-image', () => ({
  toPng: vi.fn(),
}))
// Mock Tooltip
vi.mock('@mui/material', () => ({
  Tooltip: ({ children }) => <div>{children}</div>,
}))

// Mock images
vi.mock('../../../../../../assets/images/common/drawer.svg', () => ({
  default: 'drawer.svg',
}))
vi.mock('../../../../../../assets/images/common/Close.svg', () => ({
  default: 'close.svg',
}))
vi.mock('../../../../../../assets/images/common/FailureModeLegend.svg', () => ({
  default: 'legend.svg',
}))
vi.mock('../../../../../../assets/images/common/NewFailureMode.svg', () => ({
  default: 'newLegend.svg',
}))
vi.mock('../../../../../../assets/images/sidebar/Camera.svg', () => ({
  default: 'camera.svg',
}))

describe('LegendPanel - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    mockPlant = 'testPlant'
    mockGetNodes.mockReturnValue([{ id: '1' }])
  })

  // ---------------- DOWNLOAD TESTS ----------------

  it('downloads diagram successfully with plant name', async () => {
    toPng.mockResolvedValue('data:image/png;base64,mock')

    render(<LegendPanel setShowDrawer={vi.fn()} />)

    const viewport = document.createElement('div')
    viewport.className = 'react-flow__viewport'
    document.body.appendChild(viewport)

    const button = screen.getByRole('button')
    await fireEvent.click(button)

    expect(toPng).toHaveBeenCalled()
  })

  it('uses fallback name when plant is missing', async () => {
    mockPlant = undefined
    toPng.mockResolvedValue('data:image/png;base64,mock')

    render(<LegendPanel setShowDrawer={vi.fn()} />)

    const viewport = document.createElement('div')
    viewport.className = 'react-flow__viewport'
    document.body.appendChild(viewport)

    const button = screen.getByRole('button')
    await fireEvent.click(button)

    expect(toPng).toHaveBeenCalled()
  })

  it('handles download error', async () => {
    toPng.mockRejectedValue(new Error('Export failed'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<LegendPanel setShowDrawer={vi.fn()} />)

    const viewport = document.createElement('div')
    viewport.className = 'react-flow__viewport'
    document.body.appendChild(viewport)

    await fireEvent.click(screen.getByRole('button'))

    expect(consoleSpy).toHaveBeenCalled()
  })

  it('does nothing if viewport not found', async () => {
    render(<LegendPanel setShowDrawer={vi.fn()} />)

    await fireEvent.click(screen.getByRole('button'))

    expect(toPng).not.toHaveBeenCalled()
  })

  // ---------------- DRAWER TESTS ----------------

  it('renders legend content when drawer is closed', () => {
    render(<LegendPanel showDrawer={false} setShowDrawer={vi.fn()} />)

    expect(
      screen.getByText(/HOVER OVER THE RED-COLORED OBJECT/i),
    ).toBeInTheDocument()

    expect(screen.getByText(/NEW FAILURE MODE/i)).toBeInTheDocument()
  })

  it('renders drawer icon when open', () => {
    render(<LegendPanel showDrawer={true} setShowDrawer={vi.fn()} />)

    expect(screen.getByRole('img')).toBeInTheDocument()
  })
  // ---------------- ROTATION CLASS BRANCHES ----------------

  it('applies top-center rotation', () => {
    const { container } = render(
      <LegendPanel
        legendPosition='top-center'
        showDrawer
        setShowDrawer={vi.fn()}
      />,
    )

    expect(container.innerHTML).toContain('rotate-[270deg]')
  })

  it('applies bottom-center rotation', () => {
    const { container } = render(
      <LegendPanel
        legendPosition='bottom-center'
        showDrawer
        setShowDrawer={vi.fn()}
      />,
    )

    expect(container.innerHTML).toContain('rotate-90')
  })

  it('applies left rotation', () => {
    const { container } = render(
      <LegendPanel legendPosition='left' showDrawer setShowDrawer={vi.fn()} />,
    )

    expect(container.innerHTML).toContain('rotate-180')
  })

  it('returns empty class when legendPosition is undefined', () => {
    const { container } = render(
      <LegendPanel
        legendPosition={undefined}
        showDrawer
        setShowDrawer={vi.fn()}
      />,
    )

    expect(container.innerHTML).not.toContain('rotate')
  })
})
