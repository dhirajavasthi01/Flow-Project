import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Controls, getConnectedEdges, ReactFlow, useEdgesState, useNodesState, useReactFlow, useUpdateNodeInternals, useStore } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
    deleteAtom,
    developerModeAtom,
    dragNodeTypeAtom,
    failureNodeClickedAtom,
    isFailureModeAtom,
    isFullViewAtom,
    LegendPositionAtom,
    newNodeAtom,
    nodeConfigAtom,
    scrollTickAtom,
    selectedEdgeIdAtom,
    selectedEdgeTypeAtom,
    selectedNodeIdAtom,
    showHandlesAtom,
    updateConfigAtom,
    AppAtom
} from '../../features/individualDetailWrapper/features/overview/store/OverviewStore';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { SelectionFlowRect } from './components/selectionFlowRect/SelectionFlowRect';
import { processNodesWithTableData as processNodesWithTableDataUtil } from './Flow.functions';
import { generateRandom8DigitNumber } from '../../utills/flowUtills/FlowUtills';
import { hasSubComponentAssetIdMatch } from '../../utills/flowUtills/FlowUtills'
import { allNodes, edgeTypes, nodeTypes } from './utils/nodeEdgeType/NodeEdgeType';
import { useFlowSelection } from './hooks/useFlowSelection/useFlowSelection';
import { useTemplateManager } from './hooks/useTemplateManager/useTemplateManager'
import { useTemplateDrop } from './hooks/useTemplateDrop/useTemplateDrop';
import { useFlowData } from './hooks/useFlowData/useFlowData';
import { useOutletContext } from 'react-router-dom';
import { useHelperLines } from './hooks/useHelperLines/useHelperLines';
import { HelperLines } from './components/helperLines/HelperLines';
import { handleFetchedNodesEdgesChange, handleTableDataChange } from './utils/flowHelper/FlowHelper';
import FlowPanels from './components/flowPanels/FlowPanels';
import { createEdge, updateEdgeWithConfig } from './utils/edgeHelper/EdgeHelper';
import { useFlowSnapshot } from './hooks/useFlowSnapshot/useFlowSnapshot';
import { applyResizeChanges } from './hooks/useNodeResize/useNodeResize';
import { handleDragOver, handleTemplateDropHelper, handleSaveTemplate as handleSaveTemplateHelper } from './utils/templateHelper/TemplateHelper';
import { absoluteToRelative, canBeParent, getDescendantIds, isPointInNode, relativeToAbsolute, wouldCreateCircularDependency } from './utils/parentChildUtils/ParentChildUtils';
import Marker from './marker';
function Flow(props) {
    const { tableData = [], isLoading: isLoadingFailerMode = false } = props;
    const [newNode, setNewNode] = useAtom(newNodeAtom);
    const [config, setConfig] = useAtom(nodeConfigAtom);
    const [shouldUpdateConfig, setShouldUpdateConfig] = useAtom(updateConfigAtom);
    const [show, toggle] = useAtom(showHandlesAtom)
    const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
    const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom);
    const [legendPosition, setLegendPosition] = useAtom(LegendPositionAtom);
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
    const { caseId } = useOutletContext()
    const appData = useAtomValue(AppAtom);
    const isFullView = useAtomValue(isFullViewAtom)
    const setScrollTick = useSetAtom(scrollTickAtom)
    const actualTime = appData?.actualTime
    const { saveTemplate } = useTemplateManager();
    const { handleTemplateDrop } = useTemplateDrop();
    const { snapNodePosition } = useHelperLines();
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const { selectedNodes: selNodes, allEdges: selEdges } = useFlowSelection(nodes, edges);
    const [templateDropCounts, setTemplateDropCounts] = useState({});
    const [showDrawer, setShowDrawer] = useState(false);
    const [partial, setPartial] = useState(false)
    const [potentialParentId, setPotentialParentId] = useState(null);
    const {
        nodes: fetchedNodes,
        edges: fetchedEdges,
        isLoading: loadingFlow,
        legendPosition: fetchedLegendPosition,
        isAdding,
        error,
        addFlow,
        saved
    } = useFlowData(caseId, actualTime);
    const originalFetchedNodesRef = useRef([]);
    const lastProcessedTableDataRef = useRef(null);
    const processNodesWithTableDataRef = useRef(null);
    const processNodesWithTableData = useCallback(
        (nodesToProcess, originalNodesForReset = null) => {
            return processNodesWithTableDataUtil(nodesToProcess, originalNodesForReset, tableData, isDeveloperMode, actualTime);
        },
        [tableData, isDeveloperMode, actualTime]
    );

    const checkIsDotNode = useCallback(
        (nodeId) => {
            const node = nodeLookup.get(nodeId);
            return (node?.type?.includes("dotNode") || node?.nodeType?.includes("dot-node"));
        },
        [nodeLookup]
    );

    // Use custom hook for snapshot, undo, snapping, and keyboard handling
    const { takeSnapshot, applySnappingToChanges } = useFlowSnapshot({
        nodes,
        edges,
        setNodes,
        setEdges,
        setSelectedNodeId,
        setSelectedEdgeId,
        setConfig,
        checkIsDotNode,
        snapNodePosition,
        config,
        selectedNodeId,
        nodeToCopy,
        setNewNode,
        setNodeToCopy,
        setShouldDelete,
    });

    useEffect(() => {
        if (newNode) {
            takeSnapshot();
            const newId = `${newNode.nodeType}-${generateRandom8DigitNumber()}`;
            setNodes([...nodes, {
                ...newNode,
                id: newId,
            },
            ]);
            setSelectedNodeId(newId);
            setConfig({ ...newNode, id: newId });
            setNewNode(null);
        }
    }, [newNode, nodes, takeSnapshot])

    useEffect(() => {
        processNodesWithTableDataRef.current = processNodesWithTableData;
    }, [processNodesWithTableData]);

    useEffect(() => {
        //NOSONAR
        handleFetchedNodesEdgesChange({
            fetchedNodes,
            fetchedEdges,
            fetchedLegendPosition,
            loadingFlow,
            error,
            isDeveloperMode,
            originalFetchedNodesRef,
            processNodesWithTableDataRef,
            setNodes,
            setEdges,
            setLegendPosition,
            zoomTo,
            fitView,
        });
    }, [fetchedNodes, fetchedEdges, fetchedLegendPosition, loadingFlow, error, saved, fitView, zoomTo, isDeveloperMode]);

    useEffect(() => {
        handleTableDataChange({ tableData, isDeveloperMode, originalFetchedNodesRef, lastProcessedTableDataRef, processNodesWithTableDataRef, setNodes, });
    }, [tableData, isDeveloperMode]);

    const fitViewWithPadding = useCallback(() => {
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 800 });
        }, 100);
    }, [fitView]);

    useEffect(() => {
        if (isFullView) {
            fitViewWithPadding();
        }
        if (nodes.length > 0 && !isDeveloperMode) {
            fitViewWithPadding();
        }
    }, [nodes.length, fitViewWithPadding, isFailureModeOpen, isDeveloperMode, isFullView]);

    useEffect(() => {
        if (shouldDelete) {
            if (selectedNodeId) {
                // When deleting a node, also delete all its children
                const descendantIds = getDescendantIds(nodes, selectedNodeId);
                const idsToDelete = new Set([selectedNodeId, ...descendantIds]);
                const newNodes = nodes.filter((node) => !idsToDelete.has(node.id));
                const deletedNodes = nodes.filter((node) => idsToDelete.has(node.id));
                setNodes(newNodes);
                setSelectedNodeId(null);
                setConfig(null);
                setShouldDelete(false);
                setEdges(
                    deletedNodes.reduce((acc, node) => {
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

    const handleDeleteAll = useCallback(() => {
        if (selNodes.length === 0) return;

        // Delete all selected nodes
        const selectedNodeIds = new Set(selNodes.map(node => node.id));
        const newNodes = nodes.filter((node) => !selectedNodeIds.has(node.id));
        // Get all edges connected to selected nodes
        const connectedEdges = getConnectedEdges(selNodes, edges);
        const connectedEdgeIds = new Set(connectedEdges.map(edge => edge.id));
        // Also include selected edges
        const selectedEdgeIds = new Set(selEdges.map(edge => edge.id));
        const allEdgeIdsToDelete = new Set([...connectedEdgeIds, ...selectedEdgeIds]);
        // Remove all connected and selected edges
        const newEdges = edges.filter((edge) => !allEdgeIdsToDelete.has(edge.id));
        setNodes(newNodes);
        setEdges(newEdges);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setConfig(null);
    }, [selNodes, selEdges, nodes, edges, setNodes, setEdges]);

    // Helper function to detect drag end node ID
    const detectDragEndNodeId = useCallback((changes) => {
        for (const change of changes) {
            if (change.type === 'position' && change.dragging === false) {
                return change.id;
            }
        }
        return null;
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
            let finalNodes = applyNodeChanges(changesWithSnapping, updatedNodes);
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
        takeSnapshot();
        setDraggingNodeId(node.id);
        setPotentialParentId(null);
    }, [isDeveloperMode, takeSnapshot]);

    // Handle node drag - detect when node is over a potential parent
    const onNodeDrag = useCallback((event, node) => {
        if (!isDeveloperMode) return;

        const currentNodes = getNodes();
        // Use positionAbsolute if available (React Flow provides this), otherwise use position
        const dragPoint = node.positionAbsolute || node.position;

        if (!dragPoint) return;

        // Find potential parent (a node that the dragged node is over)
        const potentialParent = currentNodes.find((n) => {
            if (n.id === node.id) return false; // Can't be parent of itself
            if (n.parentId) return false; // Parents can't have parents (for simplicity)
            if (!canBeParent(n)) return false;
            if (wouldCreateCircularDependency(currentNodes, node.id, n.id)) return false;

            // Use absolute position for parent check (React Flow provides positionAbsolute)
            const parentPos = n.positionAbsolute || n.position;
            return isPointInNode(dragPoint, {
                ...n,
                position: parentPos
            });
        });

        setPotentialParentId(potentialParent ? potentialParent.id : null);
    }, [isDeveloperMode, getNodes]);



    // Handle drag stop - clear dragging node ID
    const onNodeDragStop = useCallback((event, node) => {
        if (!isDeveloperMode) return;
        takeSnapshot();
        const currentNodes = getNodes();

        // Check if we should attach to a parent
        if (potentialParentId && potentialParentId !== node.parentId) {
            const parentNode = currentNodes.find(n => n.id === potentialParentId);
            const draggedNode = currentNodes.find(n => n.id === node.id);

            if (parentNode && draggedNode) {
                // Get absolute position of dragged node
                const draggedAbsolutePos = draggedNode.positionAbsolute || draggedNode.position;
                const parentAbsolutePos = parentNode.positionAbsolute || parentNode.position;

                if (draggedAbsolutePos && parentAbsolutePos) {
                    // Convert absolute position to relative to parent
                    // React Flow will automatically maintain this relationship
                    const relativePos = absoluteToRelative(draggedAbsolutePos, parentAbsolutePos);

                    // Update node with parent relationship
                    // React Flow automatically handles parent-child positioning when parentId is set
                    setNodes((nds) =>
                        nds.map((n) => {
                            if (n.id === node.id) {
                                return {
                                    ...n,
                                    parentId: potentialParentId,
                                    position: relativePos
                                    // React Flow will calculate positionAbsolute automatically
                                };
                            }
                            return n;
                        })
                    );

                    setPotentialParentId(null);
                    setDraggingNodeId(null);
                    return;
                }
            }
        }

        // Apply final snap position when drag stops (only if not attaching to parent)
        const isDotNode = node.type?.includes('dotNode') || node.nodeType?.includes('dot-node');
        if (!isDotNode && node.position) {
            // Use absolute position for snapping if available
            const positionForSnapping = node.positionAbsolute || node.position;
            const snappedPosition = snapNodePosition(node.id, positionForSnapping);
            const xDiff = Math.abs(snappedPosition.x - positionForSnapping.x);
            const yDiff = Math.abs(snappedPosition.y - positionForSnapping.y);

            // If there's a snap, update the node position
            if ((xDiff > 0.1 || yDiff > 0.1) && xDiff <= 5 && yDiff <= 5) {
                setNodes((nds) =>
                    nds.map((n) => {
                        if (n.id === node.id) {
                            // If node has parent, convert snapped absolute to relative
                            if (n.parentId) {
                                const parentNode = nds.find(p => p.id === n.parentId);
                                if (parentNode) {
                                    const parentAbsolutePos = parentNode.positionAbsolute || parentNode.position;
                                    if (parentAbsolutePos) {
                                        const relativePos = absoluteToRelative(snappedPosition, parentAbsolutePos);
                                        return {
                                            ...n,
                                            position: relativePos
                                            // React Flow will calculate positionAbsolute automatically
                                        };
                                    }
                                }
                            }
                            return {
                                ...n,
                                position: snappedPosition
                                // React Flow will calculate positionAbsolute automatically
                            };
                        }
                        return n;
                    })
                );
            }
        }

        setPotentialParentId(null);
        setDraggingNodeId(null);
    }, [isDeveloperMode, snapNodePosition, setNodes, takeSnapshot]);


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
            takeSnapshot();
            const newEdge = createEdge(params, selectedEdgeType);
            setEdges((eds) => addEdge(newEdge, eds));
        },
        [isDeveloperMode, selectedEdgeType, setEdges]);

    const onNodeClick = (event, node) => {
        takeSnapshot();
        const HaveFailureMode = tableData.some(
            item => {
                return hasSubComponentAssetIdMatch(node.data?.subComponentAssetId, item.subComponentAssetId)
            });
        if (isDeveloperMode || HaveFailureMode) {
            setScrollTick(t => t + 1)
            setFailureNodeClicked(node.data.subComponentAssetId);
            setIsFailureModeOpen(true)
            // Default selection behavior
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
            setConfig(node);
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
                        // Preserve parentId and position for parent-child relationships
                        parentId: node.parentId,
                        position: node.position,
                        data: { ...node.data, ...config.data },
                        width: config.data.width,
                        height: config.data.height,
                    } : node,
            );
            setNodeToUpdate(selectedNodeId);
            setNodes(updatedNodes);
            setSelectedNodeId(null);
            setShouldUpdateConfig(false);
        }
    }, [shouldUpdateConfig, config, nodes, selectedNodeId]);

    useEffect(() => {
        if (shouldUpdateConfig && selectedEdgeId) {
            const updatedEdges = updateEdgeWithConfig(edges, selectedEdgeId, config);
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

    const handleSaveClick = async () => {
        try {
            const flowData = {
                nodeJson: JSON.stringify(nodes.map(n => ({ ...n, selected: false }))),
                edgeJson: JSON.stringify(edges.map(e => ({ ...e, selected: false }))),
                saved: true,
                caseID: caseId,
                active: 0,
                createdOn: new Date().toISOString(),
                legendPosition: legendPosition
            };
            addFlow(flowData, {
                onSuccess: () => console.log('Flow diagram saved successfully'),
                onError: (error) => console.error('Error saving flow diagram:', error)
            });
            setDeveloperMode(false);

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
        handleDragOver(event);
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            // Try to handle template drop first
            const isTemplateDrop = handleTemplateDropHelper({
                event,
                screenToFlowPosition,
                handleTemplateDrop,
                templateDropCounts,
                setTemplateDropCounts,
                setNodes,
                setEdges,
            });
            // If it wasn't a template drop, handle regular node drop
            if (!isTemplateDrop) {
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
            }
        },
        [screenToFlowPosition, type, handleTemplateDrop, templateDropCounts, setTemplateDropCounts, setNodes, setEdges, setSelectedNodeId, setSelectedEdgeId, setConfig, setNewNode, setType]
    );

    const handleSaveTemplate = useCallback(() => {
        handleSaveTemplateHelper({
            selNodes,
            selEdges,
            saveTemplate,
            setShowSaveTemplate,
        });
    }, [selNodes, selEdges, saveTemplate, setShowSaveTemplate]);

    const handleSelectionChange = useCallback(({ nodes: selectedNodes }) => {
        setShowSaveTemplate((selectedNodes || []).length > 0);
    }, []);
    return (
        <div
            id="react-flow-container"
            className='h-full w-full relative'
        >

            <>
                <ReactFlow
                    nodes={nodes.map(node => {
                        // Add visual highlight to potential parent during drag
                        if (potentialParentId === node.id && draggingNodeId) {
                            return {
                                ...node,
                                style: {
                                    ...node.style,
                                    border: '3px dashed #009FDF',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 10px rgba(0, 159, 223, 0.5)'
                                }
                            };
                        }
                        return node;
                    })}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDragStop={onNodeDragStop}
                    onNodeDrag={onNodeDrag}
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
                    style={{ backgroundColor: "#FFFFFF" }}
                >
                    {partial && <SelectionFlowRect partial={partial} />}
                    {isDeveloperMode && !isFullView && <HelperLines draggingNodeId={draggingNodeId} nodes={nodes} />}
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
                    <FlowPanels {...{
                        isFullView,
                        showDeveloperMode: props?.showDeveloperMode,
                        isDeveloperMode,
                        partial,
                        setPartial,
                        show,
                        toggle,
                        handleSaveClick,
                        isAdding,
                        showSaveTemplate,
                        handleSaveTemplate,
                        selNodes,
                        selEdges,
                        legendPosition,
                        showDrawer,
                        setShowDrawer,
                        selectedNodeId,
                        getNodes,
                        setNodes,
                        nodes,
                        handleDeleteAll
                    }} />
                    <Controls position="center-right" showInteractive={isDeveloperMode} fitViewOptions={{ padding: 0.2 }} />
                    <Background variant={props?.showDeveloperMode && isDeveloperMode ? 'lines' : 'none'} />
                </ReactFlow>
            </>


        </div>
    );
}
export default Flow;