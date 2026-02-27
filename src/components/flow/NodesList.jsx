import {
  nodeConfigAtom,
  newNodeAtom,
  selectedNodeIdAtom,
  selectedEdgeIdAtom,
  dragNodeTypeAtom,
} from "../../features/individualDetailWrapper/store/OverviewStore";

import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from '@mui/icons-material/Search';

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

  const [isCollapsible, setIsCollapsible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNodeClick = (node) => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConfig(null);
    setNewNode(node);
  };

  const onDragStart = (event, nodeType) => {
    setNodeType(nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const getIcon = (isCollapsible) => {
    return isCollapsible ? <RemoveIcon /> : <AddIcon />;
  };

  const filteredNodes = allNodes.filter((node) => {
    const isNotDot = node.name !== 'Dot Node';
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotDot && matchesSearch;
  });

  console.log("allNodes========>", allNodes)

  return (
    <div className="sticky top-0 overflow-y-auto max-h-[40vmin]">
      {/* Header */}
      <div className="sticky top-0 flex justify-between items-center bg-primary_blue_bg p-[1vmin_1.5vmin]">
        <h3 className="text-16 font-weight-600 text-primary_dark_blue uppercase">
          Nodes List
        </h3>

        <button
          onClick={() => setIsCollapsible(!isCollapsible)}
          className="border border-outline_primary_blue bg-transparent rounded-full"
        >
          <span
            id="automated-testing-plant-+icon"
            data-testid="collapsible-icon"
            className="d-block"
            style={{
              width: "3vmin",
              height: "3vmin",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getIcon(isCollapsible)}
          </span>
        </button>
      </div>

      {/* Node List */}
      {isCollapsible && (
        <>
          <div className="p-[1vmin_1.5vmin] bg-primary_blue_bg">
            <div className="relative flex items-center border border-primary_gray_3 rounded bg-white px-2">
              <SearchIcon sx={{ fontSize: '2vmin', color: 'gray' }} />
              <input
                type="text"
                placeholder="Search nodes..."
                className="w-full p-1 text-12 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 items-center justify-between gap-[2vmin] p-[1.5vmin_1.5vmin]">
            {filteredNodes.length > 0 &&
              filteredNodes.map((node) => (
                <div
                  key={node.name}
                  data-testid={`node-${node.name}`}
                  id={`node-list-${node.name}`}
                  className={`border border-primary_gray_14 rounded hover:bg-primary_blue flex justify-center items-center p-[1vmin_0] bg-primary_blue_4 cursor-pointer ${node.name === "Textbox" ? "self-stretch h-auto" : ""
                    }`}
                  onDragStart={(event) => onDragStart(event, node.type)}
                  draggable
                  onClick={() => handleNodeClick(node)}
                >
                  {svgMap[node?.nodeType] ? (
                    <img
                      src={svgMap[node?.nodeType]}
                      alt={node.name}
                      style={{ width: '35px', height: '35px' }}
                    />
                  ) : (
                    <div className="h-full text-12 text-primary_gray font-sabic_text_bold flex items-center justify-center text-center px-1">
                      {node.name}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
};

export default NodesList;
