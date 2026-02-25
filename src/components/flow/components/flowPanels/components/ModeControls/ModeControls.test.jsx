import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ModeControls from './ModeControls'

// ---------------------------
// Mocks
// ---------------------------

// Mock Panel from @xyflow/react
vi.mock('@xyflow/react', () => ({
  Panel: ({ children }) => <div data-testid='panel'>{children}</div>,
}))

// Mock utility functions
const relativeToAbsoluteMock = vi.fn()
const sortNodesByParentChildMock = vi.fn()

vi.mock('../../../../utils/parentChildUtils/ParentChildUtils', () => ({
  relativeToAbsolute: (...args) => relativeToAbsoluteMock(...args),
  sortNodesByParentChild: (...args) => sortNodesByParentChildMock(...args),
}))

// ---------------------------
// Helpers
// ---------------------------

const createDefaultProps = () => ({
  showDeveloperMode: true,
  isDeveloperMode: true,
  partial: false,
  setPartial: vi.fn(),
  show: false,
  toggle: vi.fn(),
  handleSaveClick: vi.fn(),
  isAdding: false,
  showSaveTemplate: false,
  handleSaveTemplate: vi.fn(),
  selNodes: [],
  selEdges: [],
  selectedNodeId: undefined,
  getNodes: vi.fn(),
  setNodes: vi.fn(),
  nodes: [],
  handleDeleteAll: vi.fn(),
})

const renderComponent = (overrideProps = {}) => {
  const props = { ...createDefaultProps(), ...overrideProps }
  return render(<ModeControls {...props} />)
}

// ---------------------------
// Tests
// ---------------------------

describe('ModeControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render if developer mode is disabled', () => {
    const { container } = renderComponent({
      showDeveloperMode: false,
    })

    expect(container.firstChild).toBeNull()
  })

  it('toggles partial selection checkbox', async () => {
    const user = userEvent.setup()
    const setPartial = vi.fn()

    renderComponent({ setPartial })

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(setPartial).toHaveBeenCalled()
  })

  it('calls toggle when handles button is clicked', async () => {
    const user = userEvent.setup()
    const toggle = vi.fn()

    renderComponent({ toggle })

    await user.click(screen.getByTestId('handles-button'))

    expect(toggle).toHaveBeenCalledWith(true)
  })

  it('renders delete button when nodes are selected', () => {
    renderComponent({
      selNodes: [{ id: '1' }, { id: '2' }],
    })

    expect(screen.getByTestId('delete-all-button')).toBeInTheDocument()
    expect(screen.getByText('Delete All (2 nodes)')).toBeInTheDocument()
  })

  it('does not render delete button when no nodes selected', () => {
    renderComponent({ selNodes: [] })

    expect(screen.queryByTestId('delete-all-button')).not.toBeInTheDocument()
  })

  it('calls handleDeleteAll when delete button is clicked', async () => {
    const user = userEvent.setup()
    const handleDeleteAll = vi.fn()

    renderComponent({
      selNodes: [{ id: '1' }],
      handleDeleteAll,
    })

    await user.click(screen.getByTestId('delete-all-button'))

    expect(handleDeleteAll).toHaveBeenCalled()
  })

  it('renders save template button when enabled', () => {
    renderComponent({
      showSaveTemplate: true,
      selNodes: [{ id: '1' }],
      selEdges: [{ id: 'e1' }],
    })

    expect(screen.getByTestId('save-template-button')).toBeInTheDocument()

    expect(
      screen.getByText('Save as Template (1 node, 1 edge)'),
    ).toBeInTheDocument()
  })

  it('calls handleSaveClick when save button is clicked', async () => {
    const user = userEvent.setup()
    const handleSaveClick = vi.fn()

    renderComponent({ handleSaveClick })

    await user.click(screen.getByTestId('save-button'))

    expect(handleSaveClick).toHaveBeenCalled()
  })

  it('disables detach button when selected node has no parent', () => {
    renderComponent({
      selectedNodeId: '1',
      getNodes: vi
        .fn()
        .mockReturnValue([{ id: '1', position: { x: 0, y: 0 } }]),
    })

    expect(screen.getByTestId('detach-button')).toBeDisabled()
  })

  it('enables detach button when selected node has parent', () => {
    renderComponent({
      selectedNodeId: '1',
      getNodes: vi.fn().mockReturnValue([
        {
          id: '1',
          parentId: 'parent',
          position: { x: 10, y: 10 },
        },
      ]),
    })

    expect(screen.getByTestId('detach-button')).not.toBeDisabled()
  })

  it('detaches node correctly', async () => {
    const user = userEvent.setup()

    const childNode = {
      id: 'child',
      parentId: 'parent',
      position: { x: 10, y: 10 },
      data: { isAttachedToGroup: true },
    }

    const parentNode = {
      id: 'parent',
      positionAbsolute: { x: 100, y: 100 },
    }

    const getNodes = vi.fn().mockReturnValue([childNode, parentNode])

    relativeToAbsoluteMock.mockReturnValue({
      x: 110,
      y: 110,
    })

    sortNodesByParentChildMock.mockImplementation((nodes) => nodes)

    const setNodes = vi.fn()

    renderComponent({
      selectedNodeId: 'child',
      getNodes,
      setNodes,
    })

    await user.click(screen.getByTestId('detach-button'))

    expect(relativeToAbsoluteMock).toHaveBeenCalledWith(
      childNode.position,
      parentNode.positionAbsolute,
    )

    expect(setNodes).toHaveBeenCalled()

    const updater = setNodes.mock.calls[0][0]
    const updatedNodes = updater([childNode, parentNode])

    const updatedChild = updatedNodes.find((n) => n.id === 'child')

    expect(updatedChild.parentId).toBeUndefined()
    expect(updatedChild.position).toEqual({ x: 110, y: 110 })
    expect(updatedChild.extent).toBeUndefined()
    expect(updatedChild.data.isAttachedToGroup).toBe(false)
  })
})
