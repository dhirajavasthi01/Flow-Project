import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import { useNodeResize } from '../../hooks/useNodeResize/useNodeResize';
import Handles from '../../handles/Handles';
import SvgNode from 'uivisual/SvgNode';

const BaseSvgNode = ({
  id,
  data,
  selected,
  type,
  nodeType,
  svgPath,
  isDeveloperMode,
  isSelected,
  isHighlighted,
  resizeOptions = { minWidth: 10, minHeight: 20 },
  svgNodeProps = {},
}) => {
  // CRITICAL: Don't provide onResize/onResizeEnd to NodeResizer for existing nodes
  // React Flow's NodeResizer needs to handle resize through handleNodesChange
  // Custom handlers can prevent React Flow from properly initializing resize functionality
  // We'll track resize state separately and persist in handleNodesChange
  const {
    defaultNodeColor,
    defaultStrokeColor = '#000000',
    ...restSvgNodeProps
  } = svgNodeProps;

  return (
    <>
      <NodeResizer
        isVisible={selected && isDeveloperMode}
        minWidth={resizeOptions.minWidth}
        minHeight={resizeOptions.minHeight}
        // Don't provide onResize/onResizeEnd - let React Flow handle it through handleNodesChange
        // This ensures NodeResizer works for both new and existing nodes
      />
        <SvgNode
          id={id}
          data={data}
          svgPath={svgPath}
          nodeType={nodeType}
          defaultNodeColor={defaultNodeColor}
          defaultStrokeColor={defaultStrokeColor}
          HandlesComponent={Handles}
          isHighlighted={isHighlighted}
          selected={selected}
          isSelected={isSelected}
          isDeveloperMode={isDeveloperMode}
          {...restSvgNodeProps}
        />
    </>
  );
};

export default memo(BaseSvgNode);

