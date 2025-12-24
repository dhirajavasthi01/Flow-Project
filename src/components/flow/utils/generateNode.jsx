import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { svgMap } from '../svgMap';
import BaseSvgNode from '../nodes/BaseSvgNode';
import { useNodeCommon } from '../nodes/useNodeCommon';
import { toPascalCase, toKebabCase, toCamelCase, getDisplayName } from './nodeNameUtils';

/**
 * Generates a NodeFieldConfig for a given SVG filename
 */
export function generateNodeFieldConfig(filename) {
  // Default field configuration - most nodes use gradientColor
  return {
    fields: [
      { label: "Node Color", name: "nodeColor", type: "gradientColor" },
      { label: "Stroke Color", name: "strokeColor", type: "color" },
      { label: "Sub System", name: "subSystem", type: "text" },
    ],
  };
}

/**
 * Generates a NodeConfig for a given SVG filename
 */
export function generateNodeConfig(filename) {
  const kebabName = toKebabCase(filename);
  const camelName = toCamelCase(filename);
  const displayName = getDisplayName(filename);
  
const isSpecial = kebabName.includes('gear') || kebabName.includes('tank');
  return {
    name: displayName,
    nodeType: kebabName,
    type: camelName,
    position: { x: 0, y: 0 },
    data: {
      subSystem: null,
      nodeColor: isSpecial ? undefined : "#a9a6a6", 
      strokeColor: isSpecial ? undefined : "#000000",
      nodeType: kebabName,
    },
  };
}
/**
 * Generates a Node component for a given SVG filename
 */
export function generateNodeComponent(filename) {
  const kebabName = toKebabCase(filename);
  
  const NodeComponent = ({ data, id, selected, type }) => {
    // Use useReactFlow to get the full node object which includes nodeType at top level
    const { getNode } = useReactFlow();
    const node = getNode(id);
    
    // Get nodeType from node object (top level) or from data (fallback) or use kebabName
    const nodeType = node?.nodeType || data?.nodeType || kebabName;
   
    
    const nodeCommon = useNodeCommon(id, data);

    return (
      <BaseSvgNode
        id={id}
        data={data}
        selected={selected}
        type={type}
        nodeType={nodeType}
        isDeveloperMode={nodeCommon.isDeveloperMode}
        isSelected={nodeCommon.isSelected}
        isHighlighted={nodeCommon.isHighlighted}
        isNodeActive={nodeCommon.selectedId === id}
        nodeCommon={nodeCommon}
        svgNodeProps={{
          defaultWidth: data.width,
          defaultHeight: data.height,
        }}
      />
    );
  };

  return memo(NodeComponent);
}

/**
 * Generates all node exports (NodeFieldConfig, NodeConfig, Node) for a given SVG filename
 */
export function generateNodeExports(filename) {
  try {
    const pascalName = toPascalCase(filename);
    
    const fieldConfig = generateNodeFieldConfig(filename);
    const nodeConfig = generateNodeConfig(filename);
    const nodeComponent = generateNodeComponent(filename);
    // Verify all exports were created
    if (!fieldConfig || !nodeConfig || !nodeComponent) {
      return null;
    }
    
    return {
      [`${pascalName}NodeFieldConfig`]: fieldConfig,
      [`${pascalName}NodeConfig`]: nodeConfig,
      [`${pascalName}Node`]: nodeComponent,
    };
  } catch (error) {
    return null;
  }
}

