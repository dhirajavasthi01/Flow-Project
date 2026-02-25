import { describe, it, expect, vi, beforeEach } from 'vitest'

/* -------------------- MOCKS -------------------- */

// Mock node name utils
vi.mock('../../../../utills/nodeNameUtils/nodeNameUtils', () => ({
  toKebabCase: vi.fn(() => 'test-node'),
  toCamelCase: vi.fn(() => 'testNode'),
}))

// Mock generateNodeExports
vi.mock('../../components/generateNode/GenerateNode', () => ({
  generateNodeExports: vi.fn((filename) => {
    if (filename === 'invalid.svg') return null

    return {
      TestNode: () => null,
      TestNodeConfig: {
        name: 'Test Node',
        nodeType: 'testNode',
      },
      TestNodeFieldConfig: {
        fields: [],
      },
    }
  }),
}))

// Mock special Dot configs
vi.mock('../../nodes/dot/DotConfig', () => ({
  DotConfigTop: { name: 'Dot Top', nodeType: 'dotNodeTop' },
  DotConfigBottom: { name: 'Dot Bottom', nodeType: 'dotNodeBottom' },
  DotConfigLeft: { name: 'Dot Left', nodeType: 'dotNodeLeft' },
  DotConfigRight: { name: 'Dot Right', nodeType: 'dotNodeRight' },
  DotFieldConfig: { fields: ['dot'] },
}))

vi.mock('../../nodes/dot', () => ({
  Dot: () => null,
}))

// Mock TextBox
vi.mock('../../components/textBox/TextboxConfig', () => ({
  TextBoxNodeConfig: { name: 'TextBox', nodeType: 'textBoxNode' },
  TextBoxNodeFieldConfig: { fields: ['text'] },
}))

vi.mock('../../components/textBox/TextBox', () => ({
  TextboxNode: () => null,
}))

// Mock federated FlowingPipeEdge
vi.mock('ADFPUIVisuals/FlowingPipeEdge', () => ({
  default: vi.fn((props) => ({ rendered: true, ...props })),
}))

/* -------------------- import.meta.glob MOCK -------------------- */
beforeEach(() => {
  vi.stubGlobal('import', {
    meta: {
      glob: vi.fn(() => ({
        '/icons/test.svg': {},
        '/icons/invalid.svg': {},
      })),
    },
  })
})

/* -------------------- TESTS -------------------- */
describe('NodeEdgeType', async () => {
  const module = await import('./NodeEdgeType')

  it('should generate nodeTypes dynamically', () => {
    expect(module.nodeTypes).toHaveProperty('testNode')
    expect(typeof module.nodeTypes.testNode).toBe('function')
  })

  it('should include manual special nodes', () => {
    expect(module.nodeTypes.dotNodeTop).toBeDefined()
    expect(module.nodeTypes.dotNodeBottom).toBeDefined()
    expect(module.nodeTypes.dotNodeLeft).toBeDefined()
    expect(module.nodeTypes.dotNodeRight).toBeDefined()
    expect(module.nodeTypes.textBoxNode).toBeDefined()
  })

  it('should build allNodes including manual configs', () => {
    const names = module.allNodes.map((n) => n.name)

    expect(names).toContain('Test Node')
    expect(names).toContain('Dot Top')
    expect(names).toContain('Dot Bottom')
    expect(names).toContain('Dot Left')
    expect(names).toContain('Dot Right')
    expect(names).toContain('TextBox')
  })

  it('should generate nodeTypesConfig dynamically', () => {
    expect(module.nodeTypesConfig).toHaveProperty('test-node')
    expect(module.nodeTypesConfig['test-node']).toEqual({ fields: [] })
  })

  it('should include manual node field configs', () => {
    expect(module.nodeTypesConfig['dot-node-top']).toBeDefined()
    expect(module.nodeTypesConfig['dot-node-bottom']).toBeDefined()
    expect(module.nodeTypesConfig['dot-node-left']).toBeDefined()
    expect(module.nodeTypesConfig['dot-node-right']).toBeDefined()
    expect(module.nodeTypesConfig['text-box-node']).toBeDefined()
  })

  it('should render flowingPipe edge types when loaded', () => {
    const edge = module.edgeTypes.flowingPipe({ id: '1' })
    expect(edge.rendered).toBe(true)
    expect(edge.type).toBe('flowingPipeStraightWithoutArrow')
  })

  it('should render dotted and arrow edge variants', () => {
    expect(module.edgeTypes.flowingPipeDotted({}).type).toBe('dotted')

    expect(module.edgeTypes.flowingPipeDottedArrow({}).type).toBe('dottedArrow')

    expect(module.edgeTypes.straightArrow({}).type).toBe('straightArrow')

    expect(module.edgeTypes.bezierArrow({}).type).toBe('bezier')
  })
})
