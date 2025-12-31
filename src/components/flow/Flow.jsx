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
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteAtom,
  developerModeAtom,
  dragNodeTypeAtom,
  failureNodeClickedAtom,
  isFailureModeAtom,
  isFullViewAtom,
  newNodeAtom,
  nodeConfigAtom,
  selectedEdgeIdAtom,
  selectedEdgeTypeAtom,
  selectedNodeIdAtom,
  showHandlesAtom,
  updateConfigAtom,
  // AppAtom
} from '../../features/individualDetailWrapper/store/OverviewStore';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { SelectionFlowRect } from './SelectionFlowRect';
import {
  processNodesWithTableData as processNodesWithTableDataUtil,
  mergeProcessedNodesWithCurrent,
  createTableDataKey
} from './Flow.functions';
import { generateRandom8DigitNumber, hasSubComponentAssetIdMatch } from '../../utills/flowUtills/FlowUtills';
import { allNodes, edgeTypes, nodeTypes } from './NodeEdgeTypes';
import { useFlowSelection } from './hooks/useFlowSelection/useFlowSelection';
import { useTemplateManager } from './hooks/useTemplateManager/useTemplateManager'
import { useTemplateDrop } from './hooks/useTemplateDrop/useTemplateDrop';
import { useTextBoxClickHandler } from './hooks/useTextBoxClickHandler/useTextBoxClickHandler';
import { useFlowData } from './hooks/useFlowData/useFlowData';
import { useOutletContext } from 'react-router-dom';
import { AppAtom } from '../../features/individualDetailWrapper/store/IndividualDetailWrapperStore';
import Loader from '../loader/Loader';
import { useHelperLines } from './hooks/useHelperLines/useHelperLines';
import { HelperLines } from './HelperLines';
import Marker from './marker/Marker';
// const Marker = lazy(() => import("ADFPUIVisuals/Marker"));
function Flow(props) {
    const { tableData = [], isLoading: isLoadingFailerMode = false } = props;
    const [newNode, setNewNode] = useAtom(newNodeAtom);
    const [config, setConfig] = useAtom(nodeConfigAtom);
    const [shouldUpdateConfig, setShouldUpdateConfig] =
        useAtom(updateConfigAtom);
    const [show, toggle] = useAtom(showHandlesAtom)
    const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
    const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom);
    const [nodeToUpdate, setNodeToUpdate] = useState(null);
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [isDeveloperMode, setDeveloperMode] = useAtom(developerModeAtom);
    const [isFailureModeOpen, setIsFailureModeOpen] = useAtom(isFailureModeAtom);
    const setFailureNodeClicked = useSetAtom(failureNodeClickedAtom)
    const [shouldDelete, setShouldDelete] = useAtom(deleteAtom);
    const [type, setType] = useAtom(dragNodeTypeAtom);
    const [nodeToCopy, setNodeToCopy] = useState(null);
    const updateNodeInternals = useUpdateNodeInternals();
    const { screenToFlowPosition, fitView, zoomTo, getNodes } = useReactFlow();
    const selectedEdgeType = useAtom(selectedEdgeTypeAtom);
    const nodeLookup = useStore((s) => s.nodeLookup);
    const handleTextBoxClick = useTextBoxClickHandler();
    const { caseId } = useOutletContext()
    const appData = useAtomValue(AppAtom);
    const isFullView = useAtomValue(isFullViewAtom)
    const actualTime = appData?.actualTime
    // Template functionality
    const { saveTemplate } = useTemplateManager();
    const { handleTemplateDrop } = useTemplateDrop();
    const { snapNodePosition } = useHelperLines();
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const { selectedNodes: selNodes, allEdges: selEdges } = useFlowSelection(nodes, edges);
    const [templateDropCounts, setTemplateDropCounts] = useState({});
    const [partial, setPartial] = useState(false)
    const {
        nodes: fetchedNodes,
        edges: fetchedEdges,
        isLoading: loadingFlow,
        isAdding,
        error,
        addFlow,
        saved
    } = useFlowData(caseId, actualTime);
    const originalFetchedNodesRef = useRef([]);
    const lastProcessedTableDataRef = useRef(null);
    const processNodesWithTableDataRef = useRef(null);
  // Wrapper function that calls the utility with current component state

  const processNodesWithTableData = useCallback(
    (nodesToProcess, originalNodesForReset = null) => {
      return processNodesWithTableDataUtil(
        nodesToProcess,
        originalNodesForReset,
        tableData,
        isDeveloperMode,
        actualTime
      );
    },
    [tableData, isDeveloperMode, actualTime]
  );
  useEffect(() => {
    processNodesWithTableDataRef.current = processNodesWithTableData;
  }, [processNodesWithTableData]);
    useEffect(() => {  //NOSONAR
    if (fetchedNodes.length > 0 && !loadingFlow) {
      // Always store original nodes for reprocessing (even in developer mode)
      // This ensures we can reprocess when exiting developer mode or when tableData changes
      // Store a deep copy to avoid mutations affecting the original reference
      const currentOriginalIds = originalFetchedNodesRef.current.map(n => n.id).sort().join(',');
      const fetchedIds = fetchedNodes.map(n => n.id).sort().join(','); //NOSONAR
      if (originalFetchedNodesRef.current.length === 0 || currentOriginalIds !== fetchedIds) {
        // Store deep copy of fetched nodes to preserve original state
        originalFetchedNodesRef.current = fetchedNodes.map(node => ({
          ...node,
          data: { ...node.data },
          style: node.style ? { ...node.style } : undefined
        }));
      }
      // Only process nodes with tableData when not in developer mode
      if (!isDeveloperMode) {
        // Pass fetchedNodes as both nodesToProcess and originalNodesForReset since they're the original nodes
        const processedNodes = processNodesWithTableDataRef.current
          ? processNodesWithTableDataRef.current(fetchedNodes, fetchedNodes)
          : fetchedNodes;
        // Ensure all edges have default strokeWidth if not set
        const processedEdges = fetchedEdges.map(edge => ({
          ...edge,
          style: {
            stroke: '#000000',
            ...edge.style,
            // Ensure strokeWidth is set, use existing or default to 5
            strokeWidth: edge.style?.strokeWidth || 1
          }
        }));
        setNodes(processedNodes);
        setEdges(processedEdges);
        setTimeout(() => {
          zoomTo(0.5);
          fitView({ duration: 800 });
        }, 100);
      } else {
        // In developer mode, just set nodes and edges as-is
        setNodes(fetchedNodes);
        const processedEdges = fetchedEdges.map(edge => ({
          ...edge,
          style: {
            stroke: '#000000',
            ...edge.style,
            strokeWidth: edge.style?.strokeWidth || 5
          }
        }));
        setEdges(processedEdges);
      }
    } else if (error) {
      console.error('Error loading flow data:', error);
      setNodes([]);
      setEdges([]);
    }
  }, [fetchedNodes, fetchedEdges, loadingFlow, error, saved, fitView, zoomTo, isDeveloperMode]);
  // Reprocess nodes when tableData changes or developer mode is toggled (when not in developer mode)
  // This preserves current node state (like resize dimensions) while updating data properties
  useEffect(() => { //NOSONAR
    // Only reprocess when not in developer mode and we have original nodes
    if (originalFetchedNodesRef.current.length > 0 && !isDeveloperMode) {
      // Check if tableData actually changed to avoid unnecessary reprocessing
      const tableDataKey = createTableDataKey(tableData);
      if (lastProcessedTableDataRef.current === tableDataKey) {
        return; // Skip if tableData hasn't actually changed
      }
      lastProcessedTableDataRef.current = tableDataKey;
      // Use current nodes to preserve resize and other manual changes, but update from original for data matching
      setNodes((currentNodes) => {
        // Process original nodes to get the data updates (red color, tooltip, blinking)
        const processedNodes = processNodesWithTableDataRef.current
          ? processNodesWithTableDataRef.current(originalFetchedNodesRef.current, originalFetchedNodesRef.current)
          : originalFetchedNodesRef.current;
        // Merge processed nodes with current nodes to preserve state
        return mergeProcessedNodesWithCurrent(processedNodes, currentNodes);
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
  }, [tableData, isDeveloperMode]);
    const fitViewWithPadding = useCallback(() => {
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 800 });
        }, 100);
    }, [fitView]);
    useEffect(() => {
        if(isFullView){
          fitViewWithPadding();
        }
        if (nodes.length > 0 && !isDeveloperMode) {
            fitViewWithPadding();
        }
    }, [nodes.length, fitViewWithPadding, isFailureModeOpen, isDeveloperMode,isFullView]);
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
                        const remainingEdges = acc.filter(
                            (edge) => !connectedEdges.includes(edge),
                        );
                        return [...remainingEdges];
                    }, edges),
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
    // Helper function to detect drag end node ID
    const detectDragEndNodeId = useCallback((changes) => {
        for (const change of changes) {
            if (change.type === 'position' && change.dragging === false) {
                return change.id;
            }
        }
        return null;
    }, []);
    // Helper function to check if a node is a dot node
    const checkIsDotNode = useCallback((nodeId) => {
        const node = nodeLookup.get(nodeId);
        return node?.type?.includes('dotNode') || node?.nodeType?.includes('dot-node');
    }, [nodeLookup]);
    // Helper function to check if snapping should be applied
    const shouldApplySnapping = useCallback((change, dragEndNodeId) => {
        if (change.type !== 'position' || !change.position) return false;
        const isDragging = change.dragging === true;
        const isDragEnd = change.dragging === false && change.id === dragEndNodeId;
        return isDragging || isDragEnd;
    }, []);
    // Helper function to check if snap distance is valid
    const isValidSnapDistance = useCallback((snappedPosition, originalPosition) => {
        const maxSnapDistance = 5;
        const xDiff = Math.abs(snappedPosition.x - originalPosition.x);
        const yDiff = Math.abs(snappedPosition.y - originalPosition.y);
        if (xDiff > maxSnapDistance || yDiff > maxSnapDistance) return false;
        return xDiff > 0.1 || yDiff > 0.1;
    }, []);
    // Helper function to apply snapping to a single change
    const applySnappingToChange = useCallback((change, dragEndNodeId) => {
        if (!shouldApplySnapping(change, dragEndNodeId)) {
            return change;
        }
        if (checkIsDotNode(change.id)) {
            return change;
        }
        const snappedPosition = snapNodePosition(change.id, change.position);
        if (!isValidSnapDistance(snappedPosition, change.position)) {
            return change;
        }
        return {
            ...change,
            position: snappedPosition,
        };
    }, [shouldApplySnapping, checkIsDotNode, snapNodePosition, isValidSnapDistance]);
    // Helper function to apply snapping to all changes
    const applySnappingToChanges = useCallback((changes, dragEndNodeId) => {
        return changes.map(change => applySnappingToChange(change, dragEndNodeId));
    }, [applySnappingToChange]);
    // Helper function to apply resize changes to nodes
    const applyResizeChanges = useCallback((nodes, changesWithSnapping) => {
        return nodes.map((node) => {
            const resizeChange = changesWithSnapping.find(
                (change) => change.type === 'resize' && change.id === node.id
            );
            if (!resizeChange) return node;
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
        });
    }, []);
    // Helper function to update originalFetchedNodesRef when nodes are resized
    const updateOriginalFetchedNodesRef = useCallback((finalNodes) => {
        originalFetchedNodesRef.current = finalNodes.map(node => {
            const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
            if (!originalNode) return node;
            return {
                ...originalNode,
                style: node.style,
                data: {
                    ...originalNode.data,
                    width: node.data.width,
                    height: node.data.height
                }
            };
        });
    }, []);
    const handleNodesChange = useCallback(
        (changes) => {
            if (!isDeveloperMode) return;
            const dragEndNodeId = detectDragEndNodeId(changes);
            const changesWithSnapping = applySnappingToChanges(changes, dragEndNodeId);
            const updatedNodes = applyResizeChanges(nodes, changesWithSnapping);
            const finalNodes = applyNodeChanges(changesWithSnapping, updatedNodes);
            setNodes(finalNodes);
            if (changes.some(change => change.type === 'resize')) {
                updateOriginalFetchedNodesRef(finalNodes);
            }
        },
        [nodes, setNodes, isDeveloperMode, detectDragEndNodeId, applySnappingToChanges, applyResizeChanges, updateOriginalFetchedNodesRef]
    );
    // Handle drag start - immediately set dragging node ID for helper lines
    const onNodeDragStart = useCallback((event, node) => {
        if (!isDeveloperMode) return;
        setDraggingNodeId(node.id);
    }, [isDeveloperMode]);
    // Handle drag stop - clear dragging node ID
    const onNodeDragStop = useCallback((event, node) => {
        if (!isDeveloperMode) return;
        // Apply final snap position when drag stops
        const isDotNode = node.type?.includes('dotNode') || node.nodeType?.includes('dot-node');
        if (!isDotNode && node.position) {
            const snappedPosition = snapNodePosition(node.id, node.position);
            const xDiff = Math.abs(snappedPosition.x - node.position.x);
            const yDiff = Math.abs(snappedPosition.y - node.position.y);
            // If there's a snap, update the node position
            if ((xDiff > 0.1 || yDiff > 0.1) && xDiff <= 5 && yDiff <= 5) {
                setNodes((nds) =>
                    nds.map((n) =>
                        n.id === node.id
                            ? { ...n, position: snappedPosition }
                            : n
                    )
                );
            }
        }
        setDraggingNodeId(null);
    }, [isDeveloperMode, snapNodePosition, setNodes]);
    const handleEdgesChange = useCallback(
        (changes) => {
            if (!isDeveloperMode) return;
            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        [setEdges, isDeveloperMode],
    );
    const onConnect = useCallback(
        (params) => {
            if (!isDeveloperMode) return;
            let newEdge;
            switch (selectedEdgeType) {
                case 'straight':
                    newEdge = {
                        ...params,
                        type: 'flowingPipe'
                    };
                    break;
                case 'dotted':
                    newEdge = {
                        ...params,
                        type: 'flowingPipeDotted'
                    };
                    break;
                case 'dottedArrow':
                    newEdge = {
                        ...params,
                        type: 'flowingPipeDottedArrow',
                        markerEnd: { type: 'arrowclosed', width: 10, height: 10, color: '#000' }
                    };
                    break;
                default:
                    newEdge = {
                        ...params,
                        type: 'flowingPipeStraightArrow',
                        markerEnd: { type: 'arrowclosed', width: 10, height: 10, color: '#000' }
                    };
            }
            setEdges((eds) => addEdge(newEdge, eds));
        },
        [isDeveloperMode, selectedEdgeType, setEdges]
    );
    const onNodeClick = (event, node) => {
        const HaveFailureMode = tableData.some(
            item => {
                return hasSubComponentAssetIdMatch(node.data?.subComponentAssetId, item.subComponentAssetId)
            }
        );
        if (isDeveloperMode || HaveFailureMode) {
            const targetNode = handleTextBoxClick(event, node, {
                nodeLookup,
                isDeveloperMode,
                screenToFlowPosition,
                getNodes,
                setNodes,
            });
            setFailureNodeClicked(node.data.subComponentAssetId);
            setIsFailureModeOpen(true)
            if (targetNode) {
                // Update Recoil and local state from here
                setSelectedEdgeId(null);
                setSelectedNodeId(targetNode.id);
                setConfig(targetNode);
            } else {
                // Default selection behavior
                setSelectedNodeId(node.id);
                setSelectedEdgeId(null);
                setConfig(node);
            }
        }
    };
    const onEdgeClick = (event, edge) => {
        if (!isDeveloperMode) return;
        setSelectedEdgeId(edge.id);
        setSelectedNodeId(null);
        setConfig({
            ...edge,
            configType: 'edge',
            style: edge.style || { stroke: '#000000', strokeWidth: 5 }
        });
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
                        height: config.data.height,
                    }
                    : node,
            );
            setNodeToUpdate(selectedNodeId);
            setNodes(updatedNodes);
            setSelectedNodeId(null);
            setShouldUpdateConfig(false);
        }
    }, [shouldUpdateConfig, config, nodes, selectedNodeId]);
    useEffect(() => {
        if (shouldUpdateConfig && selectedEdgeId) {
            const updatedEdges = edges.map((edge) => {
                if (edge.id === selectedEdgeId) {
                    const isDotted = config.type === 'flowingPipeDotted' || config.type === 'flowingPipeDottedArrow';
                    const updatedEdge = {
                        ...edge,
                        type: config.type,
                        markerEnd: config.markerEnd,
                        style: config.style || edge.style
                    };
                    if (isDotted) {
                        updatedEdge.style = {
                            ...updatedEdge.style,
                            strokeDasharray: updatedEdge.style.strokeDasharray || '5,5'
                        };
                    } else {
                        const { strokeDasharray, ...styleWithoutDash } = updatedEdge.style || {};
                        updatedEdge.style = styleWithoutDash;
                    }
                    return updatedEdge;
                }
                return edge;
            });
            setEdges(updatedEdges);
            setSelectedEdgeId(null);
            setShouldUpdateConfig(false);
        }
    }, [shouldUpdateConfig, config, edges, selectedEdgeId]);
    useEffect(() => {
        if (newNode) {
            const newId = `${newNode.nodeType}-${generateRandom8DigitNumber()}`;
            setNodes([
                ...nodes,
                {
                    ...newNode,
                    id: newId,
                },
            ]);
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
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
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
                createdBy: "test"
            };
            addFlow(flowData, {
                onSuccess: () => {
                    console.log("Flow diagram saved successfully");
                },
                onError: (error) => {
                    console.error("Error saving flow diagram:", error);
                },
            });
            setDeveloperMode(false)
            toggle(false)
        } catch (error) {
            console.error("Error saving flow diagram:", error);
        }
    };
    const onPaneClick = () => {
        setConfig(null);
        setSelectedEdgeId(null);
        setSelectedNodeId(null);
    };
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        // Prefer copy cursor when dragging templates
        const hasTemplateType = Array.from(event.dataTransfer?.types || []).includes('application/template');
        const plain = event.dataTransfer?.getData && event.dataTransfer.getData('text/plain');
        const isTemplateFallback = plain?.startsWith('TEMPLATE:');
        event.dataTransfer.dropEffect = (hasTemplateType || isTemplateFallback) ? 'copy' : 'move';
    }, []);
    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            // Check if it's a template drop
            let templateData = event.dataTransfer.getData('application/template');
            if (!templateData) {
                const fallback = event.dataTransfer.getData('text/plain');
                if (fallback?.startsWith('TEMPLATE:')) {
                    templateData = JSON.stringify({ templateId: fallback.replace('TEMPLATE:', '') });
                }
            }
            if (templateData) {
                try {
                    const { templateId } = JSON.parse(templateData);
                    // Get current drop count for this template
                    const currentDropCount = templateDropCounts[templateId] || 0;
                    const newDropCount = currentDropCount + 1;
                    // Update drop count
                    setTemplateDropCounts(prev => ({
                        ...prev,
                        [templateId]: newDropCount
                    }));
                    const result = handleTemplateDrop(
                        templateId,
                        position,
                        (newNodes) => {
                            console.log('Adding nodes:', newNodes.map(n => ({ id: n.id, type: n.type })));
                            setNodes(prev => [...prev, ...newNodes]);
                        },
                        (newEdges) => {
                            console.log('Adding edges:', newEdges.map(e => ({ id: e.id, source: e.source, target: e.target })));
                            setEdges(prev => [...prev, ...newEdges]);
                        },
                        newDropCount
                    );
                    if (result.success) {
                        console.log('Template dropped successfully:', result);
                    } else {
                        console.error('Failed to drop template:', result.error);
                    }
                    console.log('=== END DROP DEBUG ===');
                } catch (error) {
                    console.error('Error parsing template data:', error);
                }
                return;
            }
            // Handle regular node drop
            if (!type || !position) {
                return;
            }
            const newNodeData = allNodes.find((x) => x.type === type);
            if (newNodeData) {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                setConfig(null);
                setNewNode({ ...newNodeData, position });
                setType(null);
            }
        },
        [screenToFlowPosition, type, handleTemplateDrop],
    );
    // Template-related functions
    const handleSaveTemplate = useCallback(() => {
        const selectedNodes = selNodes;
        const allEdges = selEdges;
        if (selectedNodes.length === 0) {
            alert('Please select at least one node to save as template');
            return;
        }
        const name = prompt('Enter template name:', `Template ${Date.now()}`);
        if (!name?.trim()) {
            return;
        }
        try {
            saveTemplate(name.trim(), selectedNodes, allEdges);
            setShowSaveTemplate(false);
            alert(`Template "${name}" saved successfully with ${selectedNodes.length} nodes and ${allEdges.length} edges!`);
        } catch (error) {
            alert(`Error saving template: ${error.message}`);
        }
    }, [selNodes, selEdges, saveTemplate]);
    const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }) => {
        setShowSaveTemplate((selectedNodes || []).length > 0);
    }, []);
    return (
        <div
            id="react-flow-container"
            className='h-full w-full relative'
        >
            {/* {isLoadingFailerMode || loadingFlow || !actualTime ? <Loader /> :
                ( */}
                    <>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={handleNodesChange}
                            onEdgesChange={handleEdgesChange}
                            onNodeDragStart={onNodeDragStart}
                            onNodeDragStop={onNodeDragStop}
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
                            panOnDrag={isDeveloperMode}
                            selectionMode="partial"
                            onInit={fitViewWithPadding}
                            onPaneClick={onPaneClick}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            style={{ backgroundColor: "#FFFFFF" }}
                        >
                            {partial && <SelectionFlowRect partial={partial} />}
                            {isDeveloperMode && <HelperLines draggingNodeId={draggingNodeId} nodes={nodes} />}
                            <Suspense fallback={null}>
                                <Marker type="flowingPipeStraightArrow" />
                            </Suspense>
                            <Suspense fallback={null}>
                                <Marker type="flowingPipe" />
                            </Suspense>
                            <Suspense fallback={null}>
                                <Marker type="flowingPipeDotted" />
                            </Suspense>
                            <Suspense fallback={null}>
                                <Marker type="flowingPipeDottedArrow" />
                            </Suspense>
                            {!isFullView && (<>
                            <Panel position="top-left" className="lasso-controls">
                                {props?.showDeveloperMode && isDeveloperMode && (
                                    <label className='text-20'>
                                        <input
                                            type="checkbox"
                                            checked={partial}
                                            onChange={() => setPartial((p) => !p)}
                                            className="xy-theme__checkbox mr-[0.5vmin]"
                                        />
                                        <span className='text-20 font-sabic_text_bold pt-[0.5vmin]'>Partial selection</span>
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
                                            {show ? "Hide Handles" : "Show Handles"}
                                        </button>
                                        <button
                                            id="save-button"
                                            data-testid="save-button"
                                            onClick={handleSaveClick}
                                            className="w-fit flex justify-center items-center cursor-pointer uppercase text-14 font-medium bg-primary_blue text-white rounded-[0.3vmin] h-full px-[1.5vmin] py-[1vmin] hover:bg-primary_blue_hover transition"
                                        >
                                            {isAdding ? "Saving..." : "Save"}
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
                                        {selNodes.length !== 1 ? "s" : ""}, {selEdges.length} edge
                                        {selEdges.length !== 1 ? "s" : ""})
                                    </button>
                                )}
                            </Panel>
                            </>)}
                            {!(props?.showDeveloperMode && isDeveloperMode) &&
                                <Panel className='absolute right-[5vmin]' position="bottom-right">
                                    <div className='flex items-center gap-[.5vmin] uppercase p-[.5vmin_1vmin] text-12 bg-primary_yellow_bg font-medium'>
                                        <span className='w-[1.8vmin] h-[1.8vmin] bg-primary_orange'></span>
                                        <p className='text-primary_gray mt-[.3vmin] font-sabic_text_bold'>HOVER OVER THE RED-COLORED OBJECT TO VIEW THE FAILURE MODE</p>
                                    </div>
                                </Panel>
                            }
                            <Controls position="bottom-right" showInteractive={isDeveloperMode} />
                            <Background variant={props?.showDeveloperMode && isDeveloperMode ? 'lines' : 'none'} />
                        </ReactFlow>
                    </>
                {/* )
            } */}
        </div>
    );
}
export default Flow;
 