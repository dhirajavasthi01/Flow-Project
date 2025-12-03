import {

  nodeConfigAtom,

  newNodeAtom,

  selectedNodeIdAtom,

  selectedEdgeIdAtom,

  dragNodeTypeAtom,

  showHandlesAtom

} from '../../features/individualDetailWrapper/store/OverviewStore';

import { useAtomValue, useSetAtom } from 'jotai';

import { allNodes } from './NodeEdgeTypes';
import { svgMap } from './svgMap';

 

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

    <div>

      {showHandles && <div className='flex justify-between items-center bg-primary_blue_bg p-[1vmin_1.5vmin]'>

        <h3 className="text-16 font-weight-600 text-primary_dark_blue uppercase ">

          Handle Node List

        </h3>

      </div>}

      <div className="flex flex-wrap items-center justify-between gap-[0.5vmin] p-[1vmin_1.5vmin]" >

        {allNodes.filter((node) => node.name === 'Dot Node').map((node) => {

          return (

 

            <div

              data-testid={`node-${node.name}`}

              id={`node-list-${node.name}`}

              className={`${!showHandles ? "hidden" : "border border-primary_gray_14 rounded hover:bg-primary_blue flex justify-center items-center p-[0.8vmin_0.8vmin] bg-primary_blue_4"}`}

              onDragStart={(event) => onDragStart(event, node.type)}

              draggable

              onClick={() => handleNodeClick(node)}

              key={node.name}

            >

              <div className='flex justify-center items-center flex-row-reverse gap-[0.5vmin]'>

                {(<div className=" pt-[0.3vmin] text-14 uppercase ">{node?.data?.dotPosition}</div>)}

                {svgMap[node?.nodeType] ? (

                  <img

                    src={svgMap[node?.nodeType]}

                    alt={node.name}

                    style={{

                      width: node.name === 'Dot Node' ? '1vmin' : '80px',

                      height: node.name === 'Dot Node' ? '1vmin' : '80px',

                      marginLeft: node?.data?.dotPosition === 'bottom' ? '5px' : '0px'

                    }}

                  />

                ) : (

                  <div style={{ color: 'black' }}>{node.name}</div>

                )}

              </div>

            </div>

 

          )

        })}

      </div>

    </div>

  );

};

 

export default HandleNodeList;

 

 