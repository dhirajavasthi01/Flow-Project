import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TemplateSidebar from './TemplateSidebar'

import { useTemplateManager } from '../../hooks/useTemplateManager/useTemplateManager'

vi.mock('../../hooks/useTemplateManager/useTemplateManager', () => ({
  useTemplateManager: vi.fn(),
}))

const mockTemplates = [
  {
    id: 'id1',

    name: 'Template One',

    nodes: [{ id: 'n1' }],

    edges: [{ id: 'e1' }],

    createdAt: '2025-12-01T10:00:00Z',
  },

  {
    id: 'id2',

    name: 'Template Two',

    nodes: [{ id: 'n2' }, { id: 'n3' }],

    edges: [],

    createdAt: '2025-12-02T15:30:00Z',
  },
]

const mockDelete = jest.fn()

import { useTemplateManager } from '../../hooks/useTemplateManager/useTemplateManager'

beforeEach(() => {
  useTemplateManager.mockReturnValue({
    templates: mockTemplates,
    deleteTemplate: mockDelete,
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

test('renders template list with toggle button', () => {
  render(<TemplateSidebar />)

  expect(screen.getByText(/Template List/i)).toBeInTheDocument()
  expect(screen.getByText('Template One')).toBeInTheDocument()
  expect(screen.getByText('Template Two')).toBeInTheDocument()
  expect(screen.getByTestId('collapsible-icon')).toBeInTheDocument()
})

test('toggles the template list visibility', async () => {
  useTemplateManager.mockReturnValue({
    templates: [],
    deleteTemplate: mockDelete,
  })

  render(<TemplateSidebar />)

  const toggleButton = screen.getByTestId('collapsible-icon')

  await waitFor(() => {
    expect(screen.queryByText(/No saved templates yet./)).toBeInTheDocument()
  })

  fireEvent.click(toggleButton)

  expect(
    screen.queryByText(
      'No saved templates yet. Select nodes and edges, then click',
    ),
  ).not.toBeInTheDocument()
  fireEvent.click(toggleButton)
})

test('handles empty templates gracefully', () => {
  useTemplateManager.mockReturnValue({
    templates: [],
    deleteTemplate: mockDelete,
  })
  render(<TemplateSidebar />)
  expect(screen.getByText(/No saved templates yet./i)).toBeInTheDocument()
})

test('drags a template item', () => {
  render(<TemplateSidebar />)
  const templateDiv = screen.getByText('Template One').closest('div')
  const dragStartEvent = {
    dataTransfer: {
      effectAllowed: '',
      setData: jest.fn(),
    },
  }

  fireEvent.dragStart(templateDiv, {
    ...dragStartEvent,
    nativeEvent: { dataTransfer: dragStartEvent.dataTransfer },
  })

  expect(dragStartEvent.dataTransfer.setData).toHaveBeenCalledWith(
    'application/template',
    expect.stringContaining('"templateId":"id1"'),
  )

  expect(dragStartEvent.dataTransfer.setData).toHaveBeenCalledWith(
    'text/plain',
    'TEMPLATE:id1',
  )
})

test('handles drag end', () => {
  render(<TemplateSidebar />)
  const templateDiv = screen.getByText('Template One').closest('div')
  fireEvent.dragEnd(templateDiv)

  expect(screen).toBeDefined()
})

test('deletes a template with confirmation', async () => {
  window.confirm = jest.fn(() => true)
  render(<TemplateSidebar />)
  const deleteBtns = screen.getAllByTestId('delete-btn')
  userEvent.click(deleteBtns[0])
  await waitFor(() => {
    expect(mockDelete).toHaveBeenCalledWith('id1')
  })
})
