import { describe, it, expect } from 'vitest'

import {
  DotFieldConfig,
  DotConfigTop,
  DotConfigBottom,
  DotConfigRight,
  DotConfigLeft,
} from './DotConfig'

describe('dotConfig.js - 100% Coverage', () => {
  describe('DotFieldConfig', () => {
    it('should export correct field configuration', () => {
      expect(DotFieldConfig).toBeDefined()
      expect(Array.isArray(DotFieldConfig.fields)).toBe(true)
      expect(DotFieldConfig.fields).toHaveLength(1)

      const field = DotFieldConfig.fields[0]

      expect(field).toEqual({
        label: 'Node Color',
        name: 'nodeColor',
        type: 'color',
      })

      expect(field.label).toBe('Node Color')
      expect(field.name).toBe('nodeColor')
      expect(field.type).toBe('color')
    })
  })

  const testDotConfigStructure = (config, expected) => {
    expect(config).toBeDefined()

    expect(config.name).toBe('Dot Node')
    expect(typeof config.name).toBe('string')

    expect(config.nodeType).toBe(expected.nodeType)
    expect(typeof config.nodeType).toBe('string')

    expect(config.type).toBe(expected.type)
    expect(typeof config.type).toBe('string')

    expect(config.position).toEqual({ x: 0, y: 0 })
    expect(config.position.x).toBe(0)
    expect(config.position.y).toBe(0)

    expect(config.data).toBeDefined()
    expect(config.data.dotPosition).toBe(expected.dotPosition)
    expect(config.data.nodeColor).toBe('#000000')

    expect(typeof config.data.dotPosition).toBe('string')
    expect(typeof config.data.nodeColor).toBe('string')
  }

  describe('DotConfigTop', () => {
    it('should have correct configuration for top dot', () => {
      testDotConfigStructure(DotConfigTop, {
        nodeType: 'dot-node-top',
        type: 'dotNodeTop',
        dotPosition: 'top',
      })
    })
  })

  describe('DotConfigBottom', () => {
    it('should have correct configuration for bottom dot', () => {
      testDotConfigStructure(DotConfigBottom, {
        nodeType: 'dot-node-bottom',
        type: 'dotNodeBottom',
        dotPosition: 'bottom',
      })
    })
  })

  describe('DotConfigRight', () => {
    it('should have correct configuration for right dot', () => {
      testDotConfigStructure(DotConfigRight, {
        nodeType: 'dot-node-right',
        type: 'dotNodeRight',
        dotPosition: 'right',
      })
    })
  })

  describe('DotConfigLeft', () => {
    it('should have correct configuration for left dot', () => {
      testDotConfigStructure(DotConfigLeft, {
        nodeType: 'dot-node-left',
        type: 'dotNodeLeft',
        dotPosition: 'left',
      })
    })
  })
})
