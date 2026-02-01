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
  const onResizeEnd = useNodeResize(id);
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
        onResizeEnd={onResizeEnd}
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

