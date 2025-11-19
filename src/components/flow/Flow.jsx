import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  getConnectedEdges,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
  Panel,
  useStore
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCallback, useEffect, useState, useRef } from 'react';
import {
  deleteAtom,
  developerModeAtom,
  dragNodeTypeAtom,
  failureNodeClickedAtom,
  isFailureModeAtom,
  networkLockedAtom,
  newNodeAtom,
  nodeConfigAtom,
  selectedEdgeIdAtom,
  selectedEdgeTypeAtom,
  selectedNodeAtom,
  selectedNodeIdAtom,
  showHandlesAtom,
  updateConfigAtom,
  AppAtom
} from '../../features/individualDetailWrapper/store/OverviewStore';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { SelectionFlowRect } from './SelectionFlowRect';
import { svgMap } from './SvgMap';
import Marker from './marker';
import { generateRandom8DigitNumber, shouldNodeBlink } from '../../utills/flowUtills/FlowUtills';
import { allNodes, edgeTypes, nodeTypes } from './NodeEdgeTypes';
import { useFlowSelection } from './hooks/useFlowSelection/useFlowSelection';
import { useTemplateManager } from './hooks/useTemplateManager/useTemplateManager';
import { useTemplateDrop } from './hooks/useTemplateDrop/useTemplateDrop';
import { useTextBoxClickHandler } from './hooks/useTextBoxClickHandler/useTextBoxClickHandler';
import { useFlowData } from './hooks/useFlowData/useFlowData';
import { useOutletContext } from 'react-router-dom';

function Flow(props) {
  const { tableData = [] } = props;
  const [isPageDataLoading, setPageDataLoading] = useState(false);
  const [newNode, setNewNode] = useAtom(newNodeAtom);
  const [config, setConfig] = useAtom(nodeConfigAtom);
  const [shouldUpdateConfig, setShouldUpdateConfig] = useAtom(updateConfigAtom);
  const [show, toggle] = useAtom(showHandlesAtom);
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom);
  const [nodeToUpdate, setNodeToUpdate] = useState(null);
  const [isLoading, setLoading] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isDeveloperMode, setDeveloperMode] = useAtom(developerModeAtom);
  const [isFailureModeOpen, setIsFailureModeOpen] = useAtom(isFailureModeAtom);
  const [shouldDelete, setShouldDelete] = useAtom(deleteAtom);
  const [type, setType] = useAtom(dragNodeTypeAtom);
  const [nodeToCopy, setNodeToCopy] = useState(null);
  const setFailureNodeClicked = useSetAtom(failureNodeClickedAtom);
  const appData = useAtomValue(AppAtom);
  const actualTime = appData?.actualTime || Date.now();
  const updateNodeInternals = useUpdateNodeInternals();
  const { screenToFlowPosition, fitView, zoomTo, getNodes } = useReactFlow();
  const [selectedEdgeType, setSelectedEdgeType] = useAtom(selectedEdgeTypeAtom);
  const nodeLookup = useStore((s) => s.nodeLookup);
  const handleTextBoxClick = useTextBoxClickHandler();

  const { caseId } = useOutletContext();

  // Template functionality
  const { saveTemplate } = useTemplateManager();
  const { handleTemplateDrop } = useTemplateDrop();

  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const { selectedNodes: selNodes, allEdges: selEdges } = useFlowSelection(nodes, edges);
  const [templateName, setTemplateName] = useState('');
  const [templateDropCounts, setTemplateDropCounts] = useState({});
  const [partial, setPartial] = useState(false);

  const {
    nodes: fetchedNodes,
    edges: fetchedEdges,
    diagramId,
    isLoading: loadingFlow,
    error,
    addFlow,
    saved
  } = useFlowData(caseId);

  // Store original fetchedNodes to reprocess when tableData changes
  const originalFetchedNodesRef = useRef([]);
  // Track if we've already processed nodes to avoid unnecessary reprocessing
  const lastProcessedTableDataRef = useRef(null);

  // Process nodes to match with tableData when not in developer mode
  // Preserves existing node properties (like style for resize) and only updates data properties
  const processNodesWithTableData = useCallback((nodesToProcess, preserveCurrentState = false) => {
    if (isDeveloperMode || !tableData || tableData.length === 0) {
      return nodesToProcess;
    }

    return nodesToProcess.map(node => {
      const subSystem = node.data?.subSystem;
      if (!subSystem) {
        return node;
      }
      
      // Find all matching subComponentAssetId entries in tableData (subSystem is string, subComponentAssetId is number)
      const matchingTableDataEntries = tableData.filter(
        item => String(item.subComponentAssetId) === String(subSystem)
      );

      if (matchingTableDataEntries.length > 0) {
        const nodeData = { ...node.data };

        // Use the first matching entry for color and tooltip (same as before)
        const matchingTableData = matchingTableDataEntries[0];
        
        // Check if ANY activeSince is within last 24 hours using utility function
        let shouldBlink = false;
             
        // Check all matching entries for activeSince within last 24 hours (past only)
        for (const entry of matchingTableDataEntries) {
          const activeSince = entry.activeSince;
          
          if (activeSince) {
            // Use utility function to check if node should blink
            const blinkResult = shouldNodeBlink(actualTime, activeSince, 24);
            
            if (blinkResult.shouldBlink) {
              shouldBlink = true;
              break; // Found one within 24 hours, no need to check others
            }
          }
        }

        // If node uses gradients, update gradient colors to red shades
        if (nodeData.gradientStart || nodeData.gradientEnd) {
          // Use red gradient: darker red at ends, lighter red in middle
          nodeData.gradientStart = '#cc0000'; // Lighter red
          nodeData.gradientEnd = '#cc0000';   // Darker red
        } else {
          // For non-gradient nodes, use solid red
          nodeData.nodeColor = '#cc0000';
        }

        const failureModeNames = Array.from(
          new Set(
            matchingTableDataEntries
              .map(entry => entry.failureModeName ?? entry.activeFailureMode)
              .filter(Boolean)
          )
        );

        nodeData.failureModeNames = failureModeNames;
        nodeData.shouldBlink = shouldBlink;

        return {
          ...node,
          // Preserve style (for resize) and other properties
          style: preserveCurrentState ? node.style : node.style,
          data: nodeData
        };
      }

      return node;
    });
  }, [tableData, isDeveloperMode, actualTime]);

  useEffect(() => {   
    if (fetchedNodes.length > 0 && !loadingFlow && !isDeveloperMode) {
      // Store original nodes for reprocessing
      originalFetchedNodesRef.current = fetchedNodes;

      const processedNodes = processNodesWithTableData(fetchedNodes);
      setNodes(processedNodes);
      setEdges(fetchedEdges);

      setTimeout(() => {
        zoomTo(0.5);
        fitView({ duration: 800 });
      }, 100);
    } else if (error) {
      console.error('Error loading flow data:', error);
      setNodes([]);
      setEdges([]);
    }
  }, [fetchedNodes, fetchedEdges, loadingFlow, error, saved, fitView, zoomTo, isDeveloperMode, processNodesWithTableData]);

  // Reprocess nodes when tableData changes or developer mode is toggled (when not in developer mode)
  // This preserves current node state (like resize dimensions) while updating data properties
  useEffect(() => {
    // Only reprocess when not in developer mode and we have data
    if (originalFetchedNodesRef.current.length > 0 && !isDeveloperMode && tableData && tableData.length > 0) {
      // Check if tableData actually changed to avoid unnecessary reprocessing
      const tableDataKey = JSON.stringify(
        tableData.map(item => ({
          subComponentAssetId: item.subComponentAssetId,
          failureModeName: item.failureModeName ?? item.activeFailureMode
        }))
      );
      if (lastProcessedTableDataRef.current === tableDataKey) {
        return; // Skip if tableData hasn't actually changed
      }
      lastProcessedTableDataRef.current = tableDataKey;

      // Use current nodes to preserve resize and other manual changes, but update from original for data matching
      setNodes((currentNodes) => {
        // If no current nodes, process from original
        if (currentNodes.length === 0) {
          return processNodesWithTableData(originalFetchedNodesRef.current);
        }

        // Create a map of current nodes by id to preserve their state
        const currentNodeMap = new Map(currentNodes.map(node => [node.id, node]));

        // Process original nodes to get the data updates (red color, tooltip)
        const processedNodes = processNodesWithTableData(originalFetchedNodesRef.current);

        // Merge: use processed data but preserve current node state (style, position, etc.)
        return processedNodes.map(processedNode => {
          const currentNode = currentNodeMap.get(processedNode.id);
          if (currentNode) {
            // Preserve ALL current state (style, position, dimensions, etc.) but update data properties
            const updatedData = { ...currentNode.data };

            // Update color properties (handle both gradient and solid colors)
            if (processedNode.data.gradientStart || processedNode.data.gradientEnd) {
              updatedData.gradientStart = processedNode.data.gradientStart;
              updatedData.gradientEnd = processedNode.data.gradientEnd;
            } else if (processedNode.data.nodeColor) {
              updatedData.nodeColor = processedNode.data.nodeColor;
            }

            updatedData.failureModeNames = processedNode.data.failureModeNames;
            updatedData.shouldBlink = processedNode.data.shouldBlink;

            return {
              ...currentNode,
              // Preserve style completely (includes resize dimensions)
              style: currentNode.style,
              // Preserve position
              position: currentNode.position,
              positionAbsolute: currentNode.positionAbsolute,
              // Preserve measured dimensions
              measured: currentNode.measured,
              // Update only the data properties we need
              data: updatedData
            };
          }
          return processedNode;
        });
      });
    } else if (originalFetchedNodesRef.current.length > 0 && isDeveloperMode) {
      // Check if we just entered developer mode (avoid infinite loop)
      const wasInDeveloperMode = lastProcessedTableDataRef.current === 'DEVELOPER_MODE';
      if (!wasInDeveloperMode) {
        lastProcessedTableDataRef.current = 'DEVELOPER_MODE';
        // When entering developer mode, restore original nodes (but preserve current state if nodes exist)
        setNodes((currentNodes) => {
          // If we have current nodes, preserve them (they might have resize changes)
          if (currentNodes.length > 0) {
            const originalNodeMap = new Map(originalFetchedNodesRef.current.map(node => [node.id, node]));
            return currentNodes.map(currentNode => {
              const originalNode = originalNodeMap.get(currentNode.id);
              if (originalNode) {
                // Preserve current state but restore original data
                return {
                  ...currentNode,
                  data: originalNode.data
                };
              }
              return currentNode;
            });
          }
          return originalFetchedNodesRef.current;
        });
      }
    }
  }, [tableData, isDeveloperMode]); // Removed processNodesWithTableData from dependencies

  const fitViewWithPadding = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [fitView]);

  useEffect(() => {
    if (nodes.length > 0 && !isDeveloperMode) {
      fitViewWithPadding();
    }
  }, [nodes.length, fitViewWithPadding, isFailureModeOpen, isDeveloperMode]);

  useEffect(() => {
    if (shouldDelete) {
      if (selectedNodeId) {
        const newNodes = nodes.filter((node) => node.id !== selectedNodeId);
        const deletedNode = nodes.find((node) => node.id === selectedNodeId);
        setNodes(newNodes);
        setSelectedNodeId(null);
        setConfig(null);
        setShouldDelete(false);

        setEdges(
          [deletedNode].reduce((acc, node) => {
            const connectedEdges = getConnectedEdges([node], edges);
            const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge));
            return [...remainingEdges];
          }, edges)
        );
      }

      if (selectedEdgeId) {
        const newEdges = edges.filter((edge) => edge.id !== selectedEdgeId);
        setEdges(newEdges);
        setSelectedEdgeId(null);
        setConfig(null);
        setShouldDelete(false);
      }
    }
  }, [shouldDelete, selectedEdgeId, selectedNodeId, nodes, edges]);

  const handleNodesChange = useCallback(
    (changes) => {
      if (!isDeveloperMode) return;

      const updatedNodes = nodes.map((node) => {
        const resizeChange = changes.find(
          (change) => change.type === 'resize' && change.id === node.id
        );

        if (resizeChange) {
          return {
            ...node,
            style: {
              ...node.style,
              width: resizeChange.dimensions.width,
              height: resizeChange.dimensions.height
            },
            data: {
              ...node.data,
              width: resizeChange.dimensions.width,
              height: resizeChange.dimensions.height
            }
          };
        }
        return node;
      });

      const finalNodes = applyNodeChanges(changes, updatedNodes);
      setNodes(finalNodes);

      // Update originalFetchedNodesRef when nodes are resized so dimensions persist
      // when exiting developer mode
      if (changes.some(change => change.type === 'resize')) {
        originalFetchedNodesRef.current = finalNodes.map(node => {
          const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
          if (originalNode) {
            // Preserve original data but update dimensions
            return {
              ...originalNode,
              style: node.style,
              data: {
                ...originalNode.data,
                width: node.data.width,
                height: node.data.height
              }
            };
          }
          return node;
        });
      }
    },
    [nodes, setNodes, isDeveloperMode]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      if (!isDeveloperMode) return;
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges, isDeveloperMode]
  );

  const onConnect = useCallback(
    (params) => {
      if (!isDeveloperMode) return;

      let newEdge;

      switch (selectedEdgeType) {
        case 'straightArrow':
          newEdge = {
            ...params,
            type: 'flowingPipeStraightArrow',
            data: { edgeStyleType: 'straightArrow' },
            markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#000' }
          };
          break;

        case 'straight':
          newEdge = {
            ...params,
            type: 'flowingPipeStraight',
            data: { edgeStyleType: 'straight' }
          };
          break;

        case 'dotted':
          newEdge = {
            ...params,
            type: 'flowingPipeDotted',
            data: { edgeStyleType: 'dotted' }
          };
          break;

        case 'dottedArrow':
          newEdge = {
            ...params,
            type: 'flowingPipeDottedArrow',
            data: { edgeStyleType: 'dottedArrow' },
            markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#000' }
          };
          break;

        default:
          newEdge = {
            ...params,
            type: 'flowingPipeStraightArrow',
            data: { edgeStyleType: 'straightArrow' },
            markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#000' }
          };
      }

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isDeveloperMode, selectedEdgeType, setEdges]
  );

  const onNodeClick = (event, node) => {
    const targetNode = handleTextBoxClick(event, node, {
      nodeLookup,
      isDeveloperMode,
      screenToFlowPosition,
      getNodes,
      setNodes
    });
     setFailureNodeClicked(node.data.subSystem);
     setIsFailureModeOpen(true)
    if (targetNode) {
      setSelectedEdgeId(null);
      setSelectedNodeId(targetNode.id);
      setConfig(targetNode);
    } else {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      setConfig(node);
    }
  };

  const onEdgeClick = (event, edge) => {
    if (!isDeveloperMode) return;

    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setConfig({ ...edge, configType: 'edge' });
  };

  useEffect(() => {
    if (nodeToUpdate) {
      updateNodeInternals(nodeToUpdate);
      setNodeToUpdate(null);
    }
  }, [nodeToUpdate]);

  useEffect(() => {
    if (shouldUpdateConfig && selectedNodeId) {
      const updatedNodes = nodes.map((node) =>
        node.id === selectedNodeId
          ? {
            ...node,
            data: { ...node.data, ...config.data },
            width: config.data.width,
            height: config.data.height
          }
          : node
      );

      setNodeToUpdate(selectedNodeId);
      setNodes(updatedNodes);
      setSelectedNodeId(null);
      setShouldUpdateConfig(false);
    }
  }, [shouldUpdateConfig, config, nodes, selectedNodeId]);

  useEffect(() => {
    if (shouldUpdateConfig && selectedEdgeId) {
      const updatedEdges = edges.map((edge) =>
        edge.id === selectedEdgeId
          ? {
            ...edge,
            type: config.type,
            markerEnd: config.markerEnd
          }
          : edge
      );

      setEdges(updatedEdges);
      setSelectedEdgeId(null);
      setShouldUpdateConfig(false);
    }
  }, [shouldUpdateConfig, config, edges, selectedEdgeId]);

  useEffect(() => {
    if (newNode) {
      const newId = `${newNode.nodeType}-${generateRandom8DigitNumber()}`;

      setNodes([...nodes, { ...newNode, id: newId }]);

      setSelectedNodeId(newId);
      setConfig({ ...newNode, id: newId });
      setNewNode(null);
    }
  }, [newNode, nodes]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'v' && nodeToCopy) {
        setNewNode(nodeToCopy);
        setNodeToCopy(null);
      }

      if (e.ctrlKey && e.key === 'c' && config && selectedNodeId) {
        setNodeToCopy(config);
      }

      if (e.key === 'Delete' && config) {
        setShouldDelete(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [config, nodeToCopy, selectedNodeId]);

  const handleSaveClick = async () => {
    try {
      const flowData = {
        nodeJson: JSON.stringify(nodes),
        edgeJson: JSON.stringify(edges),
        saved: true,
        caseID: caseId,
        active: 0,
        createdOn: new Date().toISOString(),
        createdBy: 'test'
      };

      addFlow(flowData, {
        onSuccess: () => console.log('Flow diagram saved successfully'),
        onError: (error) => console.error('Error saving flow diagram:', error)
      });
      setDeveloperMode(false);
    } catch (error) {
      console.error('Error saving flow diagram:', error);
    }
  };

  const onPaneClick = () => {
    setConfig(null);
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();

    const hasTemplateType = Array.from(event.dataTransfer?.types || []).includes(
      'application/template'
    );

    const plain = event.dataTransfer?.getData && event.dataTransfer.getData('text/plain');
    const isTemplateFallback = plain && plain.startsWith('TEMPLATE:');

    event.dataTransfer.dropEffect = hasTemplateType || isTemplateFallback ? 'copy' : 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      let templateData = event.dataTransfer.getData('application/template');

      if (!templateData) {
        const fallback = event.dataTransfer.getData('text/plain');
        if (fallback && fallback.startsWith('TEMPLATE:')) {
          templateData = JSON.stringify({ templateId: fallback.replace('TEMPLATE:', '') });
        }
      }

      if (templateData) {
        try {
          const { templateId } = JSON.parse(templateData);
          const currentDropCount = templateDropCounts[templateId] || 0;
          const newDropCount = currentDropCount + 1;

          setTemplateDropCounts((prev) => ({
            ...prev,
            [templateId]: newDropCount
          }));

          const result = handleTemplateDrop(
            templateId,
            position,
            (newNodes) => setNodes((prev) => [...prev, ...newNodes]),
            (newEdges) => setEdges((prev) => [...prev, ...newEdges]),
            newDropCount
          );

          if (!result.success) {
            console.error('Failed to drop template:', result.error);
          }
        } catch (error) {
          console.error('Error parsing template data:', error);
        }
        return;
      }

      if (!type || !position) return;

      const newNodeData = allNodes.find((x) => x.type === type);

      if (newNodeData) {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setConfig(null);
        setNewNode({ ...newNodeData, position });
        setType(null);
      }
    },
    [screenToFlowPosition, type, handleTemplateDrop]
  );

  const handleSaveTemplate = useCallback(() => {
    const selectedNodes = selNodes;
    const allEdges = selEdges;

    if (selectedNodes.length === 0) {
      alert('Please select at least one node to save as template');
      return;
    }

    const name = prompt('Enter template name:', `Template ${Date.now()}`);

    if (!name || !name.trim()) return;

    try {
      saveTemplate(name.trim(), selectedNodes, allEdges);
      setShowSaveTemplate(false);
      setTemplateName('');
      alert(
        `Template "${name}" saved successfully with ${selectedNodes.length} nodes and ${allEdges.length} edges!`
      );
    } catch (error) {
      alert(`Error saving template: ${error.message}`);
    }
  }, [selNodes, selEdges, saveTemplate]);

  const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }) => {
    setShowSaveTemplate((selectedNodes || []).length > 0);
  }, []);

  return (
    <div id="react-flow-container" className="h-full w-full relative" style={{ width: '100%', height: '100%' }}>
      <>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          defaultEdgeOptions={{ type: 'flowingPipeStraightArrow' }}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onSelectionChange={handleSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 2000 }}
          minZoom={0.05}
          maxZoom={3}
          nodesDraggable={isDeveloperMode}
          nodesConnectable={isDeveloperMode}
          multiSelectionKeyCode="Control"
          selectionOnDrag={isDeveloperMode}
          selectionMode="partial"
          onInit={fitViewWithPadding}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {partial && <SelectionFlowRect partial={partial} />}

          <Marker type="flowingPipeStraightArrow" />
          <Marker type="flowingPipe" />
          <Marker type="flowingPipeDotted" />
          <Marker type="flowingPipeDottedArrow" />

          <Panel position="top-left" className="lasso-controls">
            {props?.showDeveloperMode && isDeveloperMode && (
              <label className="text-20">
                <input
                  type="checkbox"
                  checked={partial}
                  onChange={() => setPartial((p) => !p)}
                  className="xy-theme__checkbox mr-[0.5vmin]"
                />

                <span className="text-22 pt-[0.5vmin]">Partial selection</span>
              </label>
            )}
          </Panel>

          <Panel position="top-right" className="p-0 flex flex-col items-end gap-2">
            {props?.showDeveloperMode && isDeveloperMode && (
              <div className="flex gap-2">
                <button
                  id="handles-button"
                  data-testid="handles-button"
                  onClick={() => toggle(!show)}
                  className="w-fit flex justify-center items-center cursor-pointer uppercase text-14 font-medium bg-primary_blue text-white rounded-[0.3vmin] h-full px-[1.5vmin] py-[1vmin] hover:bg-primary_blue_hover transition"
                >
                  {show ? 'Hide Handles' : 'Show Handles'}
                </button>

                <button
                  id="save-button"
                  data-testid="save-button"
                  onClick={handleSaveClick}
                  className="w-fit flex justify-center items-center cursor-pointer uppercase text-14 font-medium bg-primary_blue text-white rounded-[0.3vmin] h-full px-[1.5vmin] py-[1vmin] hover:bg-primary_blue_hover transition"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}

            {props?.showDeveloperMode && isDeveloperMode && showSaveTemplate && (
              <button
                id="save-template-button"
                data-testid="save-template-button"
                onClick={handleSaveTemplate}
                className="text-[1.4vmin] font-medium uppercase text-white bg-green-600 hover:bg-green-700 transition rounded-[0.3vmin] px-[1.5vmin] py-[0.4vmin]"
              >
                Save as Template ({selNodes.length} node
                {selNodes.length !== 1 ? 's' : ''}, {selEdges.length} edge
                {selEdges.length !== 1 ? 's' : ''})
              </button>
            )}
          </Panel>

          <Controls position="bottom-right" showInteractive={isDeveloperMode} />
          <Background variant={props?.showDeveloperMode && isDeveloperMode ? 'lines' : 'none'} />
        </ReactFlow>
      </>
    </div>
  );
}

export default Flow;
