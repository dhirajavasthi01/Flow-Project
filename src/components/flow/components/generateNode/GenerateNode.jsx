import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useNodeCommon } from '../../hooks/useNodeCommon/useNodeCommon';
import { toPascalCase, toKebabCase, toCamelCase, getDisplayName } from '../../../../utills/nodeNameUtils/nodeNameUtils';
import BaseSvgNode from '../baseSvgNode/BaseSvgNode';
import { svgMap } from '../svgMap/SvgMap';

export function generateNodeFieldConfig() {
  return {
    fields: [
      { label: "Node Color", name: "nodeColor", type: "gradientColor" },
      { label: "Stroke Color", name: "strokeColor", type: "color" },
      { label: "Tooltip Content", name: "tooltipContent", type: "text" },
    ],
  };
}

export function generateNodeConfig(filename) {
  const kebabName = toKebabCase(filename);
  const camelName = toCamelCase(filename);
  const displayName = getDisplayName(filename);
  return {
    name: displayName,
    nodeType: kebabName,
    type: camelName,
    position: { x: 0, y: 0 },
    data: {
      subSystem: null,
      nodeColor: undefined,
      strokeColor: undefined,
      nodeType: kebabName,
    },
  };
}

export function generateNodeComponent(filename) {
  const kebabName = toKebabCase(filename);

  const NodeComponent = ({ data, id, selected, type }) => {
    const { getNode } = useReactFlow();
    const node = getNode(id);
    const nodeType = node?.nodeType || data?.nodeType || kebabName;
    const nodeCommon = useNodeCommon(id, data);
    const svgPathValue = svgMap[nodeType];
    const svgPath = (typeof svgPathValue === 'string') ? svgPathValue : null;
    return (
      <BaseSvgNode
        id={id}
        data={data}
        selected={selected}
        type={type}
        nodeType={nodeType}
        svgPath={svgPath}
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

export function generateNodeExports(filename) {
  try {
    const pascalName = toPascalCase(filename);

    const fieldConfig = generateNodeFieldConfig();
    const nodeConfig = generateNodeConfig(filename);
    const nodeComponent = generateNodeComponent(filename);
    if (!fieldConfig || !nodeConfig || !nodeComponent) {
      return null;
    }

    return {
      [`${pascalName}NodeFieldConfig`]: fieldConfig,
      [`${pascalName}NodeConfig`]: nodeConfig,
      [`${pascalName}Node`]: nodeComponent,
    };
  } catch (error) {
    console.log(error)
    return null;
  }
}

