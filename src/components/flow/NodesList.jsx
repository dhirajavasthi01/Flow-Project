import {
  nodeConfigAtom,
  newNodeAtom,
  selectedNodeIdAtom,
  selectedEdgeIdAtom,
  dragNodeTypeAtom,
} from "../../features/individualDetailWrapper/store/OverviewStore";

import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

import { useState } from "react";
import { useSetAtom } from "jotai";

import { allNodes } from "./NodeEdgeTypes";
import { svgMap } from "./svgMap";
const NodesList = () => {
  const setConfig = useSetAtom(nodeConfigAtom);
  const setNewNode = useSetAtom(newNodeAtom);
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
  const setSelectedEdgeId = useSetAtom(selectedEdgeIdAtom);
  const setNodeType = useSetAtom(dragNodeTypeAtom);
  const [isCollapsible, setIsCollapsible] = useState(true)
  const handleNodeClick = (node) => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConfig(null);
    setNewNode(node);
  };
  const onDragStart = (event, nodeType) => {
    setNodeType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  const getImageSrc = (isCollapsible) => {
    return isCollapsible ? RemoveIcon : AddIcon;
  };
  return (
    <div
    className='sticky top-0 overflow-y-auto max-h-[37.9vmin] border-b-[0.025vmin] border-b-primary_gray_3'
    >
      <div className={`sticky top-0 flex justify-between items-center bg-primary_blue_bg p-[1.5vmin] ${(!isCollapsible ? "":"border-b-[0.025vmin] border-b-primary_gray_3")}`}>
        <h3 className="text-14 text-primary_dark_blue uppercase font-sabic_text_bold">
          Nodes List
        </h3>
        <button
          onClick={() => setIsCollapsible(!isCollapsible)}
          className={` ${(!isCollapsible ? "border" : "border border-primary_blue")}  bg-transparent rounded-full `}     >
          <img
            id="automated-testing-plant-+icon"
            src={`${getImageSrc(isCollapsible)}`}
            alt="collapsible-icon"
            data-testid="collapsible-icon"
            className="d-block"
            style={{
              width: '2vmin',
              height: '2vmin',
            }}
          />
        </button>
      </div>
      {isCollapsible && <div
      className="grid grid-cols-3 items-center justify-between gap-[2vmin]  p-[1.5vmin_1.5vmin]"
      >
        {allNodes.filter((node) => node.name !== 'Dot Node').map((node) => {
          return (
            <div
              data-testid={`node-${node.name}`}
              id={`node-list-${node.name}`}
              className={`border border-primary_gray_14 rounded hover:bg-primary_blue flex justify-center items-center p-[1vmin_0] bg-primary_blue_4 ${(node.name == "Textbox") ? "self-stretch h-auto" : ""}`}
              onDragStart={(event) => onDragStart(event, node.type)}
              draggable
              onClick={() => handleNodeClick(node)}
              key={node.name}
            >
              {svgMap[node?.nodeType] ? (
                <img
                  src={svgMap[node?.nodeType]}
                  alt={node.name}
                  style={{
                    width: '35px',
                    height: '35px',
                  }}
                />
              ) : (
                <div className='h-full text-18 text-primary_gray font-sabic_text_bold flex items-center justify-center'>{node.name}</div>
              )}
            </div>
          )
        })}
      </div>}
    </div>
  );
};
export default NodesList;
 