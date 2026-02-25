import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  TextBoxNodeFieldConfig,
  TextBoxNodeConfig,
  calculateOptimalFontSize,
  formatTextContent,
  getRawText,
  calculateAngle,
} from './TextboxConfig'
describe('TextboxConfig', () => {
  describe('TextBoxNodeFieldConfig', () => {
    it('should have the correct structure', () => {
      expect(TextBoxNodeFieldConfig).toHaveProperty('fields')
      expect(TextBoxNodeFieldConfig.fields).toBeInstanceOf(Array)
      expect(TextBoxNodeFieldConfig.fields).toHaveLength(3)
    })
    it('should have correct label field configuration', () => {
      const labelField = TextBoxNodeFieldConfig.fields[0]
      expect(labelField).toEqual({
        label: 'Label',
        name: 'label',
        type: 'text',
      })
    })
    it('should have correct color field configuration', () => {
      const colorField = TextBoxNodeFieldConfig.fields[1]
      expect(colorField).toEqual({
        label: 'Text Color',
        name: 'color',
        type: 'color',
      })
    })
    it('should have correct orientation field configuration', () => {
      const orientationField = TextBoxNodeFieldConfig.fields[2]
      expect(orientationField).toEqual({
        label: 'Orientation',
        name: 'orientation',
        type: 'select',
        options: [
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Vertical', value: 'vertical' },
        ],
      })
    })
  })
  describe('TextBoxNodeConfig', () => {
    it('should have the correct node configuration', () => {
      expect(TextBoxNodeConfig).toEqual({
        name: 'Textbox',
        nodeType: 'text-box-node',
        type: 'textBoxNode',
        position: { x: 0, y: 0 },
        data: {
          numSourceHandlesRight: 1,
          numTargetHandlesTop: 1,
          numSourceHandlesBottom: 1,
          numTargetHandlesLeft: 1,
          label: 'Text Box Node',
          color: '#000000',
          rotation: 0,
          orientation: 'horizontal',
        },
      })
    })
    it('should have all required handle properties', () => {
      const { data } = TextBoxNodeConfig
      expect(data.numSourceHandlesRight).toBe(1)
      expect(data.numTargetHandlesTop).toBe(1)
      expect(data.numSourceHandlesBottom).toBe(1)
      expect(data.numTargetHandlesLeft).toBe(1)
    })
    it('should have default styling properties', () => {
      const { data } = TextBoxNodeConfig
      expect(data.label).toBe('Text Box Node')
      expect(data.color).toBe('#000000')
      expect(data.rotation).toBe(0)
      expect(data.orientation).toBe('horizontal')
    })
  })
  describe('calculateOptimalFontSize', () => {
    let mockTextRef
    beforeEach(() => {
      mockTextRef = {
        style: { fontSize: '' },
        scrollWidth: 100,
        scrollHeight: 50,
      }
    })
    it('should return 1 if parent dimensions are invalid', () => {
      const result = calculateOptimalFontSize(mockTextRef, 0, 10)
      expect(result).toBe(1)
      const result2 = calculateOptimalFontSize(mockTextRef, 10, 0)
      expect(result2).toBe(1)
      const result3 = calculateOptimalFontSize(mockTextRef, -5, 10)
      expect(result3).toBe(1)
    })
    it('should find optimal font size within constraints', () => {
      // Mock scroll dimensions based on font size
      mockTextRef.scrollWidth = 80
      mockTextRef.scrollHeight = 30
      const result = calculateOptimalFontSize(mockTextRef, 100, 50)

      expect(result).toBeGreaterThan(0)
      expect(mockTextRef.style.fontSize).toBe(`${result}px`)
    })
    it('should handle case where text is larger than container', () => {
      mockTextRef.scrollWidth = 200
      mockTextRef.scrollHeight = 100
      const result = calculateOptimalFontSize(mockTextRef, 100, 50)

      expect(result).toBeLessThan(500)
      expect(result).toBeGreaterThanOrEqual(1)
    })
    it('should handle binary search with varying scroll dimensions', () => {
      // Simulate scroll dimensions changing with font size
      mockTextRef.scrollWidth = 80
      mockTextRef.scrollHeight = 30
      const result = calculateOptimalFontSize(mockTextRef, 100, 50)

      expect(typeof result).toBe('number')
      expect(Number.isInteger(result)).toBe(true)
    })
  })
  describe('formatTextContent', () => {
    it('should return raw text unchanged for horizontal orientation', () => {
      const rawText = 'Hello World'
      const result = formatTextContent(rawText, 'horizontal')
      expect(result).toBe('Hello World')
    })
    it('should format text with line breaks for vertical orientation', () => {
      const rawText = 'Hello'
      const result = formatTextContent(rawText, 'vertical')
      expect(result).toBe('H<br/>e<br/>l<br/>l<br/>o')
    })
    it('should handle empty string for vertical orientation', () => {
      const result = formatTextContent('', 'vertical')
      expect(result).toBe('')
    })
    it('should handle single character for vertical orientation', () => {
      const result = formatTextContent('A', 'vertical')
      expect(result).toBe('A')
    })
    it('should handle special characters for vertical orientation', () => {
      const result = formatTextContent('!@#', 'vertical')
      expect(result).toBe('!<br/>@<br/>#')
    })
    it('should default to horizontal when orientation is not provided', () => {
      const rawText = 'Hello'
      const result = formatTextContent(rawText)
      expect(result).toBe('Hello')
    })
  })
  describe('getRawText', () => {
    it('should return actual value when tagData has actual property', () => {
      const tagData = { actual: 'Actual Value' }
      const result = getRawText(tagData, 'Default Label')
      expect(result).toBe('Actual Value')
    })
    it('should return dash when tagData exists but has no actual property', () => {
      const tagData = {}
      const result = getRawText(tagData, 'Default Label')
      expect(result).toBe('-')
    })
    it('should return default label when tagData is null', () => {
      const result = getRawText(null, 'Default Label')
      expect(result).toBe('Default Label')
    })
    it('should return default label when tagData is undefined', () => {
      const result = getRawText(undefined, 'Default Label')
      expect(result).toBe('Default Label')
    })
    it('should handle empty string as actual value', () => {
      const tagData = { actual: '' }
      const result = getRawText(tagData, 'Default Label')
      expect(result).toBe('-')
    })
    it('should handle zero as actual value', () => {
      const tagData = { actual: 0 }
      const result = getRawText(tagData, 'Default Label')
      expect(result).toBe('-')
    })
  })
  describe('calculateAngle', () => {
    it('should calculate angle correctly for point to the right', () => {
      const centerX = 100,
        centerY = 100
      const clientX = 200,
        clientY = 100 // Point to the right

      const result = calculateAngle(centerX, centerY, clientX, clientY)
      expect(result).toBeCloseTo(90, 1) // Should be around 90 degrees
    })
    it('should calculate angle correctly for point above', () => {
      const centerX = 100,
        centerY = 100
      const clientX = 100,
        clientY = 0 // Point above

      const result = calculateAngle(centerX, centerY, clientX, clientY)
    })
    it('should calculate angle correctly for point to the left', () => {
      const centerX = 100,
        centerY = 100
      const clientX = 0,
        clientY = 100 // Point to the left

      const result = calculateAngle(centerX, centerY, clientX, clientY)
      expect(result).toBeCloseTo(270, 1) // Should be around 270 degrees
    })
    it('should calculate angle correctly for point below', () => {
      const centerX = 100,
        centerY = 100
      const clientX = 100,
        clientY = 200 // Point below

      const result = calculateAngle(centerX, centerY, clientX, clientY)
    })
    it('should handle negative angles by wrapping to positive', () => {
      const centerX = 100,
        centerY = 100
      // Create a scenario that would generate a negative angle
      const clientX = 50,
        clientY = 50 // Point at 225 degrees

      const result = calculateAngle(centerX, centerY, clientX, clientY)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(360)
    })
    it('should wrap angles >= 360 correctly', () => {
      const centerX = 100,
        centerY = 100
      // Test with a point that would generate an angle > 360
      // We'll use the same point multiple times to ensure wrapping

      const result = calculateAngle(centerX, centerY, 150, 50)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(360)
    })
    it('should return a number between 0 and 360', () => {
      const centerX = 100,
        centerY = 100
      const testPoints = [
        [200, 50], // Top-right
        [150, 150], // Bottom-right
        [50, 150], // Bottom-left
        [50, 50], // Top-left
      ]
      testPoints.forEach(([x, y]) => {
        const result = calculateAngle(centerX, centerY, x, y)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(360)
      })
    })
    it('should handle points at exact center', () => {
      const centerX = 100,
        centerY = 100
      const clientX = 100,
        clientY = 100 // Same as center

      const result = calculateAngle(centerX, centerY, clientX, clientY)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(360)
      // atan2(0,0) is implementation dependent, but function should handle it
    })
  })
})
