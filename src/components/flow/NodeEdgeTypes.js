// Special nodes that don't have SVG files - keep these manual
import { TextboxNode, TextBoxNodeConfig, TextBoxNodeFieldConfig } from './nodes/TextBox';
import { Dot, DotConfigBottom, DotConfigLeft, DotConfigRight, DotConfigTop, DotFieldConfig } from './nodes/Dot';
import FlowingPipeEdge from './edges/FlowingPipEdge';

// Dynamic node generation utilities
import { generateNodeExports } from './utils/generateNode';
import { toKebabCase, toCamelCase } from './utils/nodeNameUtils';

// Dynamically import all SVG files from the flowIcons folder
const svgModules = import.meta.glob('../../assets/flowIcons/*.svg', { eager: true });

/**
 * Dynamically generates all node types, configs, and field configs from SVG files
 */
const dynamicNodes = Object.keys(svgModules).reduce((acc, path) => {
  // Extract filename from path
  const filename = path.split('/').pop();
  
  if (!filename) return acc;
  
  try {
    // Generate node exports for this SVG file
    const nodeExports = generateNodeExports(filename);
  
    // Verify that exports were generated correctly
    if (!nodeExports || typeof nodeExports !== 'object') {
      return acc;
    }
    
    // Verify all required exports exist
    const exportKeys = Object.keys(nodeExports);
    const hasFieldConfig = exportKeys.some(k => k.endsWith('NodeFieldConfig'));
    const hasNodeConfig = exportKeys.some(k => k.endsWith('NodeConfig'));
    const hasNode = exportKeys.some(k => k.endsWith('Node') && !k.includes('Config') && !k.includes('Field'));
    
    if (!hasFieldConfig || !hasNodeConfig || !hasNode) {
      return acc;
    }
    
    // Store by filename for later use
    acc[filename] = {
      exports: nodeExports,
      kebabName: toKebabCase(filename),
      camelName: toCamelCase(filename),
    };
  } catch (error) {
    // Silently skip nodes that fail to generate
  }
  
  return acc;
}, {});

// Build nodeTypes object dynamically
export const nodeTypes = Object.values(dynamicNodes).reduce((acc, node) => {
  // Get the Node component from exports (e.g., BearingNode)
  const nodeComponentKey = Object.keys(node.exports).find(key => key.endsWith('Node') && !key.includes('Config') && !key.includes('Field'));
  if (nodeComponentKey) {
    acc[node.camelName] = node.exports[nodeComponentKey];
  }
  return acc;
}, {});

// Add special nodes manually
nodeTypes.dotNodeTop = Dot;
nodeTypes.dotNodeBottom = Dot;
nodeTypes.dotNodeRight = Dot;
nodeTypes.dotNodeLeft = Dot;
nodeTypes.textBoxNode = TextboxNode;

// Build allNodes array dynamically
export const allNodes = Object.values(dynamicNodes).map(node => {
  // Get the NodeConfig from exports (e.g., BearingNodeConfig)
  const configKey = Object.keys(node.exports || {}).find(key => key.endsWith('NodeConfig'));
  return configKey ? node.exports[configKey] : null;
}).filter(config => {
  return config && typeof config === 'object' && config.name && config.nodeType;
});

// Add special node configs manually
allNodes.push(DotConfigTop);
allNodes.push(DotConfigBottom);
allNodes.push(DotConfigRight);
allNodes.push(DotConfigLeft);
allNodes.push(TextBoxNodeConfig);


// Build nodeTypesConfig object dynamically
export const nodeTypesConfig = Object.values(dynamicNodes).reduce((acc, node) => {
  // Get the NodeFieldConfig from exports (e.g., BearingNodeFieldConfig)
  const fieldConfigKey = Object.keys(node.exports).find(key => key.endsWith('NodeFieldConfig'));
  if (fieldConfigKey) {
    acc[node.kebabName] = node.exports[fieldConfigKey];
  }
  return acc;
}, {});

// Add special node field configs manually
nodeTypesConfig["dot-node-top"] = DotFieldConfig || {};
nodeTypesConfig["dot-node-bottom"] = DotFieldConfig || {};
nodeTypesConfig["dot-node-right"] = DotFieldConfig || {};
nodeTypesConfig["dot-node-left"] = DotFieldConfig || {};
nodeTypesConfig["text-box-node"] = TextBoxNodeFieldConfig;

// Create edgeTypes - FlowingPipeEdge will be loaded before first use
export const edgeTypes = {
  flowingPipeStraightArrow: (props) => FlowingPipeEdge({ ...props, type: "straightArrow" }),
  flowingPipe: (props) => FlowingPipeEdge({ ...props, type: "straight" }),
  flowingPipeDotted: (props) => FlowingPipeEdge({ ...props, type: "dotted" }),
  flowingPipeDottedArrow: (props) => FlowingPipeEdge({ ...props, type: "dottedArrow" })
};
