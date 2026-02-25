import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

/* =========================================================
   GLOBAL MOCK STATE
========================================================= */

let mockIsDeveloperMode = false
let mockAllTags = [{ tagId: 1, value: 'RAW' }]
let mockNodes = [
  { id: '1', data: {}, parentId: null },
  { id: 'parent', data: {} },
]

const mockSetNodes = vi.fn((updater) => {
  if (typeof updater === 'function') {
    mockNodes = updater(mockNodes)
  }
})

const mockGetNode = vi.fn((id) => mockNodes.find((n) => n.id === id))

/* =========================================================
   MOCKS
========================================================= */

vi.mock('@xyflow/react', () => ({
  NodeResizer: ({ onResizeEnd }) => (
    <div
      data-testid='resizer'
      onClick={() => onResizeEnd({}, { width: 300, height: 150 })}
    />
  ),
  useReactFlow: () => ({
    setNodes: mockSetNodes,
    getNode: mockGetNode,
  }),
}))

vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtomValue: vi.fn((atom) => {
      if (atom === 'developerModeAtom') return mockIsDeveloperMode
      if (atom === 'allTagsDataAtom') return mockAllTags
      return null
    }),
    useSetAtom: vi.fn(() => vi.fn()),
  }
})

vi.mock(
  '../../../../features/individualDetailWrapper/features/overview/store/OverviewStore',
  () => ({
    developerModeAtom: 'developerModeAtom',
    allTagsDataAtom: 'allTagsDataAtom',
    failureNodeClickedAtom: 'failureNodeClickedAtom',
  }),
)

vi.mock(import('../../../../utills'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getValsBaseOnCondition: (condition, trueVal, falseVal) =>
      condition ? trueVal : falseVal,
    CompareValuesWithSymbol: vi.fn((op, ...vals) => {
      if (op === '&&')
        return vals.every((v) => v !== undefined && v !== null && v !== false)
      if (op === '||') return vals.some((v) => v)
      return false
    }),
    getSafe: (fn, def = null) => {
      try {
        return fn()
      } catch {
        return def
      }
    },
  }
})

vi.mock('../../../../utills/flowUtills/FlowUtills', () => ({
  EXTRA_NODE_COLORS: {
    template1: { bgColor: 'yellow' },
  },
}))

vi.mock('../../handles/Handles', () => ({
  default: () => <div data-testid='handles' />,
}))

/* Tooltip mocks */

const mockShow = vi.fn()
const mockHide = vi.fn()

vi.mock('../../nodes/nodeTooltip/NodeTooltip', () => ({
  NodeTooltip: ({ children }) => (
    <div data-testid='tooltip-wrapper'>{children}</div>
  ),
  NodeTooltipContent: ({ children }) => (
    <div data-testid='tooltip-content'>{children}</div>
  ),
  useNodeTooltip: () => ({
    showTooltip: mockShow,
    hideTooltip: mockHide,
  }),
}))

vi.mock('./TextBox.function', () => ({
  RotateHandle: ({ onMouseDown }) => (
    <div data-testid='rotate' onMouseDown={(e) => onMouseDown(e)} />
  ),
  TextContent: ({ content }) => <div data-testid='text'>{content}</div>,
  setNodesHelperFn: vi.fn(),
}))

vi.mock('./TextboxConfig', () => ({
  calculateOptimalFontSize: vi.fn(() => 18),
  formatTextContent: vi.fn((text) => `formatted-${text}`),
  getRawText: vi.fn(() => 'rawText'),
  calculateAngle: vi.fn(),
}))

/* =========================================================
   IMPORT COMPONENT
========================================================= */

import { TextboxNode } from './TextBox'

/* =========================================================
   TESTS
========================================================= */

describe('TextboxNode 100% coverage', () => {
  beforeEach(() => {
    mockIsDeveloperMode = false
    mockNodes = [
      { id: '1', data: {}, parentId: null },
      { id: 'parent', data: {} },
    ]
    vi.clearAllMocks()
  })

  const baseProps = {
    id: '1',
    selected: true,
    data: {
      width: 200,
      height: 100,
      color: 'blue',
      label: 'Header',
      template: 'template1',
      linkedTag: 1,
      tooltipContent: 'Tooltip Text',
      failureModeNames: ['Failure1', 'Failure2'],
      ttfDays: 2,
      rotation: 0,
    },
  }

  it('renders non developer mode with failure modes tooltip', () => {
    const { getByTestId, getByText } = render(<TextboxNode {...baseProps} />)

    expect(getByTestId('tooltip-wrapper')).toBeTruthy()
    expect(getByText('Failure1')).toBeTruthy()
    expect(getByText('2 Days')).toBeTruthy()
  })

  it('renders simple tooltip when no failure modes', () => {
    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
        failureModeNames: [],
      },
    }

    const { getByText } = render(<TextboxNode {...props} />)

    expect(getByText('Tooltip Text')).toBeTruthy()
  })

  it('renders null tooltip branch', () => {
    const props = {
      ...baseProps,
      data: {
        ...baseProps.data,
        tooltipContent: null,
        label: '',
        failureModeNames: null,
      },
    }

    render(<TextboxNode {...props} />)
  })

  it('renders developer mode branch', () => {
    mockIsDeveloperMode = true

    const { getByTestId } = render(<TextboxNode {...baseProps} />)

    expect(getByTestId('text')).toBeTruthy()
  })

  it('handles resize', () => {
    mockIsDeveloperMode = true

    const { getByTestId } = render(<TextboxNode {...baseProps} />)

    fireEvent.click(getByTestId('resizer'))

    expect(mockSetNodes).toHaveBeenCalled()
  })

  it('handles rotation events', () => {
    mockIsDeveloperMode = true

    const { getByTestId } = render(<TextboxNode {...baseProps} />)

    const rotate = getByTestId('rotate')

    fireEvent.mouseDown(rotate, {
      clientX: 100,
      clientY: 100,
    })

    fireEvent.mouseMove(document, {
      clientX: 120,
      clientY: 120,
    })

    fireEvent.mouseUp(document)

    expect(mockSetNodes).toHaveBeenCalled()
  })

  it('handles parent tooltip node resolution', () => {
    mockNodes = [{ id: '1', parentId: 'parent' }, { id: 'parent' }]

    render(<TextboxNode {...baseProps} />)
    expect(mockGetNode).toHaveBeenCalled()
  })

  it('handles vertical orientation', () => {
    render(
      <TextboxNode
        {...baseProps}
        data={{ ...baseProps.data, orientation: 'vertical' }}
      />,
    )
  })

  it('syncs developer mode draggable/selectable', () => {
    mockIsDeveloperMode = true

    render(<TextboxNode {...baseProps} />)
    expect(mockSetNodes).toHaveBeenCalled()
  })
})
