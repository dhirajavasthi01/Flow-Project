import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAtom, useAtomValue } from 'jotai'
import { ReactFlowProvider } from '@xyflow/react' // Use your installed version (@xyflow/react or reactflow)
import App from './index'
// 1. Mock Jotai
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtom: vi.fn(),
    useAtomValue: vi.fn(),
  }
})
vi.mock('./components/nodeList/NodesList', () => ({
  default: () => <div data-testid='nodes-list'>NodesList</div>,
}))
vi.mock('./components/handleNodeList/HandleNodeList', () => ({
  default: () => <div data-testid='handle-node-list'>HandleNodeList</div>,
}))
vi.mock('./Flow', () => ({
  default: () => <div data-testid='flow'>Flow Component</div>,
}))
vi.mock('./components/nodeConfigurator/NodeConfigurator', () => ({
  default: () => <div data-testid='node-configurator'>NodeConfigurator</div>,
}))
vi.mock('./components/templateSidebar/TemplateSidebar', () => ({
  default: () => <div data-testid='template-sidebar'>TemplateSidebar</div>,
}))
describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  const setMockValues = ({
    isDeveloperMode = false,
    isFullView = false,
    showHandles = false,
  }) => {
    vi.mocked(useAtom).mockReturnValue([showHandles, vi.fn()])
    vi.mocked(useAtomValue)
      .mockReturnValueOnce(isDeveloperMode) // 1st useAtomValue call
      .mockReturnValueOnce(isFullView) // 2nd useAtomValue call
  }
  it('should NOT render HandleNodeList when showHandles is false', () => {
    setMockValues({
      isDeveloperMode: true,
      isFullView: false,
      showHandles: false,
    })
    render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>,
    )
    expect(screen.getByTestId('nodes-list')).toBeInTheDocument()
    expect(screen.queryByTestId('handle-node-list')).not.toBeInTheDocument()
  })
  it('should render HandleNodeList when showHandles is true', () => {
    setMockValues({
      isDeveloperMode: true,
      isFullView: false,
      showHandles: true,
    })
    render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>,
    )
    expect(screen.getByTestId('handle-node-list')).toBeInTheDocument()
  })
  it('should apply flex-2 class when developerMode and isFullView are true', () => {
    setMockValues({ isDeveloperMode: true, isFullView: true })
    const { container } = render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>,
    )
    const flowContainer = container.querySelector('.flex-2')
    expect(flowContainer).toBeInTheDocument()
  })
})
