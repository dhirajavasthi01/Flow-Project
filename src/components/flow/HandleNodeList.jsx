import {
  nodeConfigAtom,
  newNodeAtom,
  selectedNodeIdAtom,
  selectedEdgeIdAtom,
  dragNodeTypeAtom,
  showHandlesAtom
} from "../../features/individualDetailWrapper/store/OverviewStore";
import { useAtomValue, useSetAtom } from "jotai";
import { allNodes } from "./NodeEdgeTypes";
import Dot from '../../assets/flowIcons/dot.svg';
const HandleNodeList = () => {
  const setConfig = useSetAtom(nodeConfigAtom);
  const setNewNode = useSetAtom(newNodeAtom);
  const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
  const setSelectedEdgeId = useSetAtom(selectedEdgeIdAtom);
  const setNodeType = useSetAtom(dragNodeTypeAtom);
  const showHandles = useAtomValue(showHandlesAtom)
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
  return (
    <div className='border-b-[0.025vmin] border-b-primary_gray_3'>
      {showHandles && <div className='flex justify-between items-center bg-primary_blue_bg p-[1.5vmin] border-b-[0.025vmin] border-b-primary_gray_3'>
        <h3 className="text-14 text-primary_dark_blue uppercase font-sabic_text_bold">
          Handle Node List
        </h3>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-[0.5vmin] p-[1vmin_1.5vmin]" >
        {allNodes.filter((node) => node.name === 'Dot Node').map((node) => {
          return node.nodeType !== "dot-node" ? (
            <div
              data-testid={`node-${node.name}`}
              id={`node-list-${node.name}`}
              className={`${!showHandles ? "hidden" : "border border-primary_gray_14 rounded hover:bg-primary_blue hover:text-primary_white flex justify-center items-center p-[0.8vmin_0.8vmin] bg-primary_blue_4"}`}
              onDragStart={(event) => onDragStart(event, node.type)}
              draggable
              onClick={() => handleNodeClick(node)}
              key={node.nodeType}
            >
              <div className='flex justify-center items-center flex-row-reverse gap-[0.9vmin]'>
                {(<div className=" pt-[0.3vmin] text-12 uppercase ">{node?.data?.dotPosition}</div>)}
                <img
                  src={DotSvg}
                  alt={node.name}
                  style={{
                    width: node.name === 'Dot Node' ? '1vmin' : '80px',
                    height: node.name === 'Dot Node' ? '1vmin' : '80px',
                    marginLeft: node?.data?.dotPosition === 'bottom' ? '5px' : '0px'
                  }}
                />
              </div>
            </div>
          ) : null
        })}
      </div>
    </div>
  );
};
export default HandleNodeList;
 