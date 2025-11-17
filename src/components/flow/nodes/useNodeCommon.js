import { useAtomValue } from 'jotai';
import { useReactFlow } from '@xyflow/react';
import {
  allTagsDataAtom,
  selectedNodeIdAtom,
  highlightedNodeTypeAtom,
  developerModeAtom,
} from '../../../features/individualDetailWrapper/store/OverviewStore';

/**
 * Custom hook that provides common node functionality used across all SVG nodes
 * @param {string} id - Node ID
 * @param {object} data - Node data
 * @returns {object} Common node state and handlers
 */
export const useNodeCommon = (id, data) => {
  const { setNodes } = useReactFlow();
  const selectedId = useAtomValue(selectedNodeIdAtom);
  const allTagsDataList = useAtomValue(allTagsDataAtom);
  const highlightedNodeType = useAtomValue(highlightedNodeTypeAtom);
  const isDeveloperMode = useAtomValue(developerModeAtom);

  const { subSystem, linkedTag, isActive } = data || {};

  // Calculate if node should be highlighted based on subSystem
  const isHighlighted =
    subSystem !== null &&
    highlightedNodeType !== null &&
    highlightedNodeType === subSystem;

  // Find tag data if linkedTag exists
  const tagData = allTagsDataList.find(
    (x) => x.tagId && x.tagId === linkedTag
  );

  // Determine if node is active based on tag data or isActive prop
  const isNodeActive = tagData ? tagData?.actual == 1 : isActive;

  // Check if this node is currently selected
  const isSelected = selectedId === id;

  return {
    setNodes,
    selectedId,
    isDeveloperMode,
    isHighlighted,
    tagData,
    isNodeActive,
    isSelected,
  };
};

