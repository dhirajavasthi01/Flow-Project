import { useAtomValue } from 'jotai';
import {
  allTagsDataAtom,
  selectedNodeIdAtom,
  highlightedNodeTypeAtom,
  developerModeAtom,
} from '../../../../features/individualDetailWrapper/features/overview/store/OverviewStore';
import { useReactFlow } from '@xyflow/react';


//Custom hook that provides common node functionality used across all SVG nodes
export const useNodeCommon = (id, data) => {
  const { setNodes } = useReactFlow();
  const selectedId = useAtomValue(selectedNodeIdAtom);
  const allTagsDataList = useAtomValue(allTagsDataAtom);
  const highlightedNodeType = useAtomValue(highlightedNodeTypeAtom);
  const isDeveloperMode = useAtomValue(developerModeAtom);

  const { subSystem, linkedTag, isActive } = data || {};

  const isHighlighted =
    subSystem !== null &&
    highlightedNodeType !== null &&
    highlightedNodeType === subSystem;

  const tagData = allTagsDataList.find(
    (x) => x.tagId && x.tagId === linkedTag
  );

  const isNodeActive = tagData ? tagData?.actual == 1 : isActive;

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

 