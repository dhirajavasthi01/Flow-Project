import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  handleDragOver,
  handleTemplateDropHelper,
  handleSaveTemplate,
} from './TemplateHelper'

// 🔹 Mock external util
vi.mock('../parentChildUtils/ParentChildUtils', () => ({
  sortNodesByParentChild: vi.fn((nodes) => nodes),
}))

import { sortNodesByParentChild } from '../parentChildUtils/ParentChildUtils'

describe('TemplateHelper', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /* ------------------------------------------------------------------
   * handleDragOver
   * ------------------------------------------------------------------ */
  describe('handleDragOver', () => {
    it('sets dropEffect to copy when application/template type exists', () => {
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          types: ['application/template'],
          dropEffect: '',
        },
      }

      handleDragOver(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.dataTransfer.dropEffect).toBe('copy')
    })

    it('sets dropEffect to copy when TEMPLATE fallback exists', () => {
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          types: [],
          getData: vi.fn().mockReturnValue('TEMPLATE:abc'),
          dropEffect: '',
        },
      }

      handleDragOver(event)

      expect(event.dataTransfer.dropEffect).toBe('copy')
    })

    it('sets dropEffect to move when no template data exists', () => {
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          types: [],
          getData: vi.fn().mockReturnValue('random'),
          dropEffect: '',
        },
      }

      handleDragOver(event)

      expect(event.dataTransfer.dropEffect).toBe('move')
    })
  })

  /* ------------------------------------------------------------------
   * handleTemplateDropHelper
   * ------------------------------------------------------------------ */
  describe('handleTemplateDropHelper', () => {
    const baseEvent = {
      preventDefault: vi.fn(),
      clientX: 10,
      clientY: 20,
      dataTransfer: {
        getData: vi.fn(),
      },
    }

    const screenToFlowPosition = vi.fn(() => ({ x: 1, y: 2 }))

    it('returns false if no template data is present', () => {
      const result = handleTemplateDropHelper({
        event: {
          ...baseEvent,
          dataTransfer: {
            getData: vi.fn().mockReturnValue(null),
          },
        },
      })

      expect(result).toBe(false)
    })

    it('handles TEMPLATE fallback and updates nodes & edges', () => {
      const setNodes = vi.fn((cb) => cb([]))
      const setEdges = vi.fn((cb) => cb([]))
      const setTemplateDropCounts = vi.fn()
      const takeSnapshot = vi.fn()

      const handleTemplateDrop = vi.fn(
        (templateId, position, onNodes, onEdges) => {
          onNodes([{ id: 'n1' }])
          onEdges([{ id: 'e1' }])
        },
      )

      const result = handleTemplateDropHelper({
        event: {
          ...baseEvent,
          dataTransfer: {
            getData: vi.fn((type) =>
              type === 'text/plain' ? 'TEMPLATE:temp1' : '',
            ),
          },
        },
        screenToFlowPosition,
        handleTemplateDrop,
        templateDropCounts: {},
        setTemplateDropCounts,
        setNodes,
        setEdges,
        takeSnapshot,
      })

      expect(result).toBe(true)
      expect(takeSnapshot).toHaveBeenCalled()
      expect(setTemplateDropCounts).toHaveBeenCalled()
      expect(sortNodesByParentChild).toHaveBeenCalled()
    })

    it('returns false when JSON parsing fails', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = handleTemplateDropHelper({
        event: {
          ...baseEvent,
          dataTransfer: {
            getData: vi.fn().mockReturnValue('INVALID_JSON'),
          },
        },
        screenToFlowPosition,
        templateDropCounts: {},
        setTemplateDropCounts: vi.fn(),
      })

      expect(result).toBe(false)
    })

    it('works without handleTemplateDrop function', () => {
      const result = handleTemplateDropHelper({
        event: {
          ...baseEvent,
          dataTransfer: {
            getData: vi
              .fn()
              .mockReturnValue(JSON.stringify({ templateId: 't1' })),
          },
        },
        screenToFlowPosition,
        templateDropCounts: {},
        setTemplateDropCounts: vi.fn(),
      })

      expect(result).toBe(true)
    })
  })

  /* ------------------------------------------------------------------
   * handleSaveTemplate
   * ------------------------------------------------------------------ */
  describe('handleSaveTemplate', () => {
    beforeEach(() => {
      vi.stubGlobal('alert', vi.fn())
      vi.stubGlobal('prompt', vi.fn())
    })

    it('alerts when no nodes are selected', () => {
      handleSaveTemplate({
        selNodes: [],
        selEdges: [],
        saveTemplate: vi.fn(),
        setShowSaveTemplate: vi.fn(),
      })

      expect(alert).toHaveBeenCalledWith(
        'Please select at least one node to save as template',
      )
    })

    it('does nothing when prompt is cancelled or empty', () => {
      prompt.mockReturnValue('   ')

      const saveTemplate = vi.fn()

      handleSaveTemplate({
        selNodes: [{ id: 1 }],
        selEdges: [],
        saveTemplate,
        setShowSaveTemplate: vi.fn(),
      })

      expect(saveTemplate).not.toHaveBeenCalled()
    })

    it('saves template successfully', () => {
      prompt.mockReturnValue('My Template')

      const saveTemplate = vi.fn()
      const setShowSaveTemplate = vi.fn()

      handleSaveTemplate({
        selNodes: [{ id: 1 }],
        selEdges: [{ id: 'e1' }],
        saveTemplate,
        setShowSaveTemplate,
      })

      expect(saveTemplate).toHaveBeenCalled()
      expect(setShowSaveTemplate).toHaveBeenCalledWith(false)
      expect(alert).toHaveBeenCalled()
    })

    it('alerts when saveTemplate throws error', () => {
      prompt.mockReturnValue('Fail Template')

      const saveTemplate = vi.fn(() => {
        throw new Error('Save failed')
      })

      handleSaveTemplate({
        selNodes: [{ id: 1 }],
        selEdges: [],
        saveTemplate,
        setShowSaveTemplate: vi.fn(),
      })

      expect(alert).toHaveBeenCalledWith(
        expect.stringContaining('Error saving template'),
      )
    })
  })
})
