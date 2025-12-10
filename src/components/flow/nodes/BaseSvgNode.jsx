import { memo, Suspense, lazy } from 'react';
import { NodeResizer } from '@xyflow/react';
import Handles from '../handles/Handles';
// Lazy load federated components
const SvgNode = lazy(() => import('uivisual/SvgNode'));
import { useNodeResize } from './useNodeResize';
import { svgMap } from '../svgMap';

/**
 * Base component for SVG nodes that handles common NodeResizer and SvgNode rendering
 * @param {object} props - Component props
 * @param {string} props.id - Node ID
 * @param {object} props.data - Node data
 * @param {boolean} props.selected - Whether node is selected
 * @param {string} props.type - Node type
 * @param {string} props.svgPath - Path to SVG file
 * @param {boolean} props.isDeveloperMode - Whether in developer mode
 * @param {boolean} props.isSelected - Whether node is selected (for stroke highlighting)
 * @param {boolean} props.isHighlighted - Whether node is highlighted
 * @param {boolean} props.isNodeActive - Whether node is active
 * @param {object} props.nodeCommon - Common node state from useNodeCommon hook
 * @param {object} props.resizeOptions - Options for NodeResizer (minWidth, minHeight)
 * @param {object} props.svgNodeProps - Additional props to pass to SvgNode
 */
const BaseSvgNode = ({
  id,
  data,
  selected,
  type,
  nodeType,
  isDeveloperMode,
  isSelected,
  isHighlighted,
  resizeOptions = { minWidth: 10, minHeight: 20 },
  svgNodeProps = {},
}) => {
  const onResizeEnd = useNodeResize(id);
  const svgPathValue = svgMap[nodeType];
  const svgPath = (typeof svgPathValue === 'string') ? svgPathValue : null;
  const {
    defaultNodeColor = '#d3d3d3',
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
      <Suspense fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading node...</div>}>
        <SvgNode
          id={id}
          data={data}
          svgPath={svgPath}
          nodeType={type}
          defaultNodeColor={defaultNodeColor}
          defaultStrokeColor={defaultStrokeColor}
        HandlesComponent={Handles}
          isHighlighted={isHighlighted}
          selected={selected}
          isSelected={isSelected}
          isDeveloperMode={isDeveloperMode}
          {...restSvgNodeProps}
        />
      </Suspense>
    </>
  );
};

export default memo(BaseSvgNode);

