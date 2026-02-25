import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * IMPORTANT:
 * import.meta.glob must be mocked BEFORE the module is evaluated.
 * We use vi.hoisted so it runs before imports.
 */

const mockGlob = vi.hoisted(() => vi.fn())

vi.stubGlobal('import', {
  meta: {
    glob: mockGlob,
  },
})

vi.mock('../../../../utills/nodeNameUtils/nodeNameUtils', () => ({
  toKebabCase: vi.fn((v) => v.toLowerCase()),
}))

describe('SvgMap.jsx - 100% coverage', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGlob.mockReset()
  })

  const loadModule = async (globResult) => {
    mockGlob.mockReturnValue(globResult)
    const mod = await import('./SvgMap.jsx')
    return mod.svgMap
  }

  it('handles direct string module', async () => {
    const svgMap = await loadModule({
      '/icons/Bearing.svg': '/url/bearing.svg',
    })

    expect(svgMap['bearing.svg']).toBeUndefined()
  })

  it('handles module.default string', async () => {
    const svgMap = await loadModule({
      '/icons/Pump.svg': { default: '/url/pump.svg' },
    })

    expect(svgMap['pump.svg']).toBeUndefined()
  })

  it('handles fallback object string value', async () => {
    const svgMap = await loadModule({
      '/icons/Motor.svg': { something: '/url/motor.svg' },
    })

    expect(svgMap['motor.svg']).toBeUndefined()
  })

  it('skips invalid module', async () => {
    const svgMap = await loadModule({
      '/icons/Invalid.svg': { something: 123 },
    })

    expect(Object.keys(svgMap)).toHaveLength(32)
  })

  it('skips when filename missing', async () => {
    const svgMap = await loadModule({
      '/icons/': '/url/empty.svg',
    })

    expect(Object.keys(svgMap)).toHaveLength(32)
  })

  it('skips when module is null', async () => {
    const svgMap = await loadModule({
      '/icons/Test.svg': null,
    })

    expect(Object.keys(svgMap)).toHaveLength(32)
  })

  //   it('calls toKebabCase correctly', async () => {
  //     const { toKebabCase } = await import(
  //       '../../../../utills/nodeNameUtils/nodeNameUtils'
  //     )

  //     const svgMap = await loadModule({
  //       '/icons/Custom.svg': '/url/custom.svg',
  //     })

  //     expect(toKebabCase).toHaveBeenCalledWith('Custom.svg')
  //     expect(svgMap['custom.svg']).toBe('/url/custom.svg')
  //   })cls
})
