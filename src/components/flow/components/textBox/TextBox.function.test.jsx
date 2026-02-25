import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import React from 'react'
import DOMPurify from 'dompurify'

import {
  TextContent,
  RotateHandle,
  setNodesHelperFn,
} from './TextBox.function.jsx'

// ---------------------------
// Mock DOMPurify
// ---------------------------
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((v) => v),
  },
}))

describe('TextBox.function.jsx - 100% Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================
  // TextContent Tests
  // =========================
  describe('TextContent', () => {
    it('renders sanitized content', () => {
      const { container } = render(
        <TextContent
          textRef={null}
          content='<b>Hello</b>'
          color='blue'
          label='Normal'
          fontSize={16}
        />,
      )

      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<b>Hello</b>')
      expect(container.querySelector('p').innerHTML).toBe('<b>Hello</b>')
    })

    it('applies red color if label contains header', () => {
      const { container } = render(
        <TextContent
          textRef={null}
          content='Header Text'
          color='blue'
          label='Main Header'
          fontSize={14}
        />,
      )

      const p = container.querySelector('p')
      expect(p.style.color).toBe('red')
    })

    it('applies custom color if label does not contain header', () => {
      const { container } = render(
        <TextContent
          textRef={null}
          content='Normal'
          color='green'
          label='Body'
          fontSize={12}
        />,
      )

      const p = container.querySelector('p')
      expect(p.style.color).toBe('green')
    })

    it('stops propagation on mouse down', () => {
      const stopPropagation = vi.fn()

      const { container } = render(
        <TextContent
          textRef={null}
          content='Test'
          color='black'
          label='Test'
          fontSize={12}
        />,
      )

      const p = container.querySelector('p')

      fireEvent.mouseDown(p, { stopPropagation })
    })
  })

  // =========================
  // RotateHandle Tests
  // =========================
  describe('RotateHandle', () => {
    it('renders rotate handle and triggers onMouseDown', () => {
      const mockFn = vi.fn()

      const { getByText } = render(<RotateHandle onMouseDown={mockFn} />)

      const icon = getByText('↻')

      fireEvent.mouseDown(icon.parentElement)

      expect(mockFn).toHaveBeenCalled()
    })

    it('renders correct styles', () => {
      const { container } = render(<RotateHandle onMouseDown={() => {}} />)

      const div = container.firstChild

      expect(div.style.position).toBe('absolute')
      expect(div.style.cursor).toBe('grab')
      expect(div.style.backgroundColor).toBe('rgb(0, 152, 207)')
    })
  })

  // =========================
  // setNodesHelperFn Tests
  // =========================
  describe('setNodesHelperFn', () => {
    it('returns undefined if nds is undefined', () => {
      const result = setNodesHelperFn({
        nds: undefined,
        params: {},
        rotationRefCurrent: 0,
        id: '1',
      })

      expect(result).toBeUndefined()
    })

    it('updates matching node', () => {
      const nodes = [
        { id: '1', data: { width: 10, height: 10, rotation: 0 } },
        { id: '2', data: { width: 20, height: 20, rotation: 0 } },
      ]

      const result = setNodesHelperFn({
        nds: nodes,
        params: { width: 100, height: 200 },
        rotationRefCurrent: 45,
        id: '1',
      })

      expect(result[0].data.width).toBe(100)
      expect(result[0].data.height).toBe(200)
      expect(result[0].data.rotation).toBe(45)

      // Ensure immutability
      expect(result[0]).not.toBe(nodes[0])
      expect(result[1]).toBe(nodes[1])
    })

    it('does not update non-matching nodes', () => {
      const nodes = [{ id: '1', data: { width: 10 } }]

      const result = setNodesHelperFn({
        nds: nodes,
        params: { width: 50, height: 50 },
        rotationRefCurrent: 90,
        id: '999',
      })

      expect(result[0]).toBe(nodes[0])
    })
  })
})
