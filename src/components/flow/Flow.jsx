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
import { generateRandom8DigitNumber, hasSubComponentAssetIdMatch, extractDimensionsFromSvgByBBox, svgDimensionsCache } from '../../utills/flowUtills/FlowUtills';
import { svgMap } from './components/svgMap/SvgMap';
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
import { applyResizeChanges, isResizingRef, persistResizeChangesRef, syncNodeDimensions } from './hooks/useNodeResize/useNodeResize';
import { handleDragOver, handleTemplateDropHelper, handleSaveTemplate as handleSaveTemplateHelper } from './utils/templateHelper/TemplateHelper';
import { absoluteToRelative, canBeParent, getDescendantIds, isPointInNode, relativeToAbsolute, wouldCreateCircularDependency, findGroupNodeAtPoint, sortNodesByParentChild } from './utils/parentChildUtils/ParentChildUtils';
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
            const svgPath = newNode.svgPath || (newNode.nodeType ? svgMap[newNode.nodeType] : null);
            
            // Function to create node with dimensions
            // setupSvgViewBox is ONLY called here when dragging from node list
            // After creation, user can resize manually - parent-child relationships are preserved
            const createNodeWithDimensions = (dimensions) => {
                const nodeToCreate = {
                    ...newNode,
                    id: newId,
                    // If newNode has parentId (dropped into a group), preserve it and auto-lock
                    parentId: newNode.parentId,
                    // Automatically lock if node has a parent
                    extent: newNode.parentId ? 'parent' : undefined,
                    data: {
                        ...newNode.data,
                        isAttachedToGroup: !!newNode.parentId
                    }
                };
                
                // If we have SVG dimensions from bounding box measurement, use them (multiplied by 10)
                // setupSvgViewBox was already called in extractDimensionsFromSvgByBBox
                // This ONLY happens when dragging from node list
                if (dimensions && dimensions.width && dimensions.height) {
                    // Multiply dimensions by 10 as requested
                    const scaledWidth = dimensions.width * 10;
                    const scaledHeight = dimensions.height * 10;
                    
                    nodeToCreate.width = scaledWidth;
                    nodeToCreate.height = scaledHeight;
                    nodeToCreate.style = {
                        ...newNode.style,
                        width: scaledWidth,
                        height: scaledHeight,
                    };
                    nodeToCreate.data = {
                        ...newNode.data,
                        width: scaledWidth,
                        height: scaledHeight,
                    };
                } else {
                    // No SVG dimensions available - use a consistent default size
                    // This ensures all new nodes get the same default size if SVG dimensions aren't available
                    // Using 250x250 as a reasonable default (same as syncNodeDimensions fallback)
                    const defaultWidth = 250;
                    const defaultHeight = 250;
                    
                    nodeToCreate.width = defaultWidth;
                    nodeToCreate.height = defaultHeight;
                    nodeToCreate.style = {
                        ...newNode.style,
                        width: defaultWidth,
                        height: defaultHeight,
                    };
                    nodeToCreate.data = {
                        ...newNode.data,
                        width: defaultWidth,
                        height: defaultHeight,
                    };
                }
                
                const newNodeWithDimensions = syncNodeDimensions(nodeToCreate);
                
                // Mark as synced to prevent re-syncing in the other useEffect
                syncedNodeIdsRef.current.add(newId);
                
                // CRITICAL: Add new node to originalFetchedNodesRef immediately so dimensions can be persisted
                // This ensures the node exists in originalFetchedNodesRef when it's resized or deselected
                if (!originalFetchedNodesRef.current.find(n => n.id === newId)) {
                    originalFetchedNodesRef.current.push(newNodeWithDimensions);
                }
                
                // Ensure parent-child ordering when adding new node
                const updatedNodes = [...nodes, newNodeWithDimensions];
                const sortedNodes = sortNodesByParentChild(updatedNodes);
                setNodes(sortedNodes);
                setSelectedNodeId(newId);
                setConfig({ ...newNode, id: newId });
                setNewNode(null);
            };
            
            // Try to get SVG dimensions by measuring bounding box (from cache or load them)
            // setupSvgViewBox is called inside extractDimensionsFromSvgByBBox
            // This ONLY happens when dragging from node list
            if (svgPath) {
                if (svgDimensionsCache.has(svgPath)) {
                    // Use cached dimensions immediately
                    const dimensions = svgDimensionsCache.get(svgPath);
                    createNodeWithDimensions(dimensions);
                } else {
                    // Load SVG dimensions by measuring bounding box, then create node
                    // setupSvgViewBox is called here to set viewBox on the SVG
                    extractDimensionsFromSvgByBBox(svgPath)
                        .then((dimensions) => {
                            createNodeWithDimensions(dimensions);
                        })
                        .catch((error) => {
                            // If loading fails, create node with defaults (will use measured dimensions)
                            createNodeWithDimensions(null);
                        });
                }
            } else {
                // No SVG path, create node with defaults (will use measured dimensions)
                createNodeWithDimensions(null);
            }
        }
    }, [newNode, nodes, takeSnapshot])

    useEffect(() => {
        processNodesWithTableDataRef.current = processNodesWithTableData;
    }, [processNodesWithTableData]);

    // Track which nodes have already been synced to prevent infinite loops
    const syncedNodeIdsRef = useRef(new Set());

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
        // Don't run handleTableDataChange while resizing to prevent interference
        if (isResizingRef.current) {
            return;
        }
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
    // Works for all node types: regular nodes, parent nodes (with children), and child nodes
    const updateOriginalFetchedNodesRef = useCallback((finalNodes) => {
        // IMPORTANT: This function now receives only the resized node(s) from onResizeEnd
        // This prevents false positives when comparing unchanged nodes
        // Only update nodes that have been resized (check if dimensions changed)
        // This ensures parent nodes can be resized without affecting their children
        // and child nodes can be resized without affecting their parent
        const resizedNodeIds = new Set();
        finalNodes.forEach(node => {
            const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
            if (originalNode) {
                // Check dimensions from all possible locations: root, style, data
                // Convert to numbers for accurate comparison (handles string vs number mismatches)
                // CRITICAL: Get dimensions from root first (most reliable), then style, then data
                const originalWidth = Number(originalNode.width || originalNode.style?.width || originalNode.data?.width);
                const originalHeight = Number(originalNode.height || originalNode.style?.height || originalNode.data?.height);
                const newWidth = Number(node.width || node.style?.width || node.data?.width);
                const newHeight = Number(node.height || node.style?.height || node.data?.height);
                
                // Only consider it a resize if dimensions actually changed (not just type conversion)
                if (!isNaN(originalWidth) && !isNaN(originalHeight) && !isNaN(newWidth) && !isNaN(newHeight)) {
                    if (originalWidth !== newWidth || originalHeight !== newHeight) {
                        resizedNodeIds.add(node.id);
                    }
                }
            } else {
                // Node doesn't exist in originalFetchedNodesRef, so it's a new node - treat as resized
                const newWidth = Number(node.width || node.style?.width || node.data?.width);
                const newHeight = Number(node.height || node.style?.height || node.data?.height);
                if (!isNaN(newWidth) && !isNaN(newHeight)) {
                    resizedNodeIds.add(node.id);
                }
            }
        });
        
        // CRITICAL: If originalFetchedNodesRef is empty, add all nodes to it
        // This handles the case where nodes are created but originalFetchedNodesRef wasn't populated
        if (originalFetchedNodesRef.current.length === 0) {
            originalFetchedNodesRef.current = finalNodes.map(node => {
                // CRITICAL: Get dimensions from root first (most reliable), then style, then data
                const nodeWidth = node.width || node.style?.width || node.data?.width;
                const nodeHeight = node.height || node.style?.height || node.data?.height;
                return {
                    ...node,
                    width: nodeWidth,
                    height: nodeHeight,
                    style: {
                        ...node.style,
                        width: nodeWidth,
                        height: nodeHeight,
                    },
                    data: {
                        ...node.data,
                        width: nodeWidth,
                        height: nodeHeight,
                    },
                };
            });
            return;
        }
        
        if (resizedNodeIds.size === 0) {
            // Even if no nodes were resized, check if any new nodes need to be added
            // OR if any nodes have parentId/position changes (re-parenting scenario)
            const hasParentOrPositionChanges = finalNodes.some(node => {
                const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
                if (originalNode) {
                    const parentIdChanged = node.parentId !== originalNode.parentId;
                    const positionChanged = node.position && originalNode.position && 
                        (node.position.x !== originalNode.position.x || node.position.y !== originalNode.position.y);
                    return parentIdChanged || positionChanged;
                }
                return false;
            });
            
            // If there are parentId/position changes, we need to update originalFetchedNodesRef
            // Otherwise, just add new nodes and return
            if (!hasParentOrPositionChanges) {
                finalNodes.forEach(node => {
                    if (!originalFetchedNodesRef.current.find(n => n.id === node.id)) {
                        const nodeWidth = node.width || node.data?.width || node.style?.width;
                        const nodeHeight = node.height || node.data?.height || node.style?.height;
                        originalFetchedNodesRef.current.push({
                            ...node,
                            width: nodeWidth,
                            height: nodeHeight,
                            style: {
                                ...node.style,
                                width: nodeWidth,
                                height: nodeHeight,
                            },
                            data: {
                                ...node.data,
                                width: nodeWidth,
                                height: nodeHeight,
                            },
                        });
                    }
                });
                return;
            }
            // If there are parentId/position changes, continue to the update logic below
        }
        
        // Only update the resized nodes, preserve all others exactly as they were
        originalFetchedNodesRef.current = originalFetchedNodesRef.current.map(originalNode => {
            const updatedNode = finalNodes.find(n => n.id === originalNode.id);
            if (updatedNode && resizedNodeIds.has(originalNode.id)) {
                // Only update dimensions for resized nodes, preserve everything else
                // Update dimensions in all locations: root, style, and data
                // CRITICAL: Get dimensions from root first (most reliable), then style, then data
                // This ensures we use the actual resized dimensions, not stale data dimensions
                const updatedWidth = updatedNode.width || updatedNode.style?.width || updatedNode.data?.width;
                const updatedHeight = updatedNode.height || updatedNode.style?.height || updatedNode.data?.height;
                
                // CRITICAL: Check if parentId or position changed (re-parenting scenario)
                // If parentId changed, we need to update it to preserve the new parent-child relationship
                // If position changed (and parentId is the same or both changed), update position
                const parentIdChanged = updatedNode.parentId !== originalNode.parentId;
                const positionChanged = updatedNode.position && originalNode.position && 
                    (updatedNode.position.x !== originalNode.position.x || updatedNode.position.y !== originalNode.position.y);
                
                const updated = {
                    ...originalNode,
                    // Update root level dimensions
                    width: updatedWidth,
                    height: updatedHeight,
                    // CRITICAL: Update parentId and position if they changed (re-parenting scenario)
                    // This ensures re-parented nodes maintain their new position when clicking on canvas
                    parentId: parentIdChanged ? updatedNode.parentId : originalNode.parentId,
                    // Update position if parentId changed (new relative position) or if position explicitly changed
                    position: (parentIdChanged || positionChanged) ? updatedNode.position : originalNode.position,
                    // positionAbsolute is calculated by React Flow, but we should update it if parentId changed
                    positionAbsolute: parentIdChanged ? updatedNode.positionAbsolute : originalNode.positionAbsolute,
                    // CRITICAL: Update style dimensions - don't spread updatedNode.style first as it may have stale dimensions
                    // Set width/height explicitly to ensure they match the root dimensions
                    style: {
                        ...originalNode.style,
                        width: updatedWidth,
                        height: updatedHeight,
                        // Preserve other style properties from updatedNode (like backgroundColor, etc.)
                        ...Object.fromEntries(
                            Object.entries(updatedNode.style || {}).filter(([key]) => key !== 'width' && key !== 'height')
                        ),
                    },
                    data: {
                        ...originalNode.data,
                        width: updatedWidth,
                        height: updatedHeight,
                    },
                };
                
                return updated;
            }
            // For non-resized nodes, check if parentId or position changed (re-parenting without resize)
            if (updatedNode) {
                const parentIdChanged = updatedNode.parentId !== originalNode.parentId;
                const positionChanged = updatedNode.position && originalNode.position && 
                    (updatedNode.position.x !== originalNode.position.x || updatedNode.position.y !== originalNode.position.y);
                
                console.log('[updateOriginalFetchedNodesRef] Checking non-resized node for parent/position changes:', {
                    nodeId: updatedNode.id,
                    parentIdChanged,
                    positionChanged,
                    originalParentId: originalNode.parentId,
                    updatedParentId: updatedNode.parentId,
                    originalPosition: originalNode.position,
                    updatedPosition: updatedNode.position
                });
                
                // If parentId or position changed, update them to preserve re-parenting
                if (parentIdChanged || positionChanged) {
                    const updated = {
                        ...originalNode,
                        parentId: parentIdChanged ? updatedNode.parentId : originalNode.parentId,
                        position: (parentIdChanged || positionChanged) ? updatedNode.position : originalNode.position,
                        positionAbsolute: parentIdChanged ? updatedNode.positionAbsolute : originalNode.positionAbsolute,
                    };
                    console.log('[updateOriginalFetchedNodesRef] Updating non-resized node with new parent/position:', {
                        nodeId: updated.id,
                        oldParentId: originalNode.parentId,
                        newParentId: updated.parentId,
                        oldPosition: originalNode.position,
                        newPosition: updated.position
                    });
                    return updated;
                }
            }
            // For non-resized nodes with no parent/position changes, return the original unchanged
            return originalNode;
        });
        
        // Add any new nodes that weren't in the original
        // CRITICAL: This ensures new nodes (dragged from node list) are added to originalFetchedNodesRef
        // so their dimensions can be persisted
        finalNodes.forEach(node => {
            if (!originalFetchedNodesRef.current.find(n => n.id === node.id)) {
                // CRITICAL: Sync dimensions to all locations before adding
                const nodeWidth = node.width || node.data?.width || node.style?.width;
                const nodeHeight = node.height || node.data?.height || node.style?.height;
                const nodeToAdd = {
                    ...node,
                    width: nodeWidth,
                    height: nodeHeight,
                    style: {
                        ...node.style,
                        width: nodeWidth,
                        height: nodeHeight,
                    },
                    data: {
                        ...node.data,
                        width: nodeWidth,
                        height: nodeHeight,
                    },
                };
                console.log('[updateOriginalFetchedNodesRef] Adding new node:', {
                    id: nodeToAdd.id,
                    parentId: nodeToAdd.parentId,
                    position: nodeToAdd.position
                });
                originalFetchedNodesRef.current.push(nodeToAdd);
            }
        });
        
        console.log('[updateOriginalFetchedNodesRef] Final originalFetchedNodesRef state:', originalFetchedNodesRef.current.map(n => ({
            id: n.id,
            parentId: n.parentId,
            position: n.position,
            positionAbsolute: n.positionAbsolute
        })));
    }, []);

    // Set up the global callback for persisting resize changes
    // This allows useNodeResize to persist changes even when handleNodesChange isn't called
    useEffect(() => {
        persistResizeChangesRef.current = updateOriginalFetchedNodesRef;
        return () => {
            persistResizeChangesRef.current = null;
        };
    }, [updateOriginalFetchedNodesRef]);

    const handleNodesChange = useCallback(
        (changes) => {
            if (!isDeveloperMode) return;
            
            // Log all changes to debug resize issues
            const hasResizeChanges = changes.some(change => change.type === 'resize');
            const hasResizeStart = changes.some(change => change.type === 'resize' && change.resizing === true);
            const hasResizeEnd = changes.some(change => change.type === 'resize' && change.resizing === false);
            
            // Track resize state to prevent handleTableDataChange from interfering
            if (hasResizeStart) {
                isResizingRef.current = true;
            }
            if (hasResizeEnd) {
                // Clear resize flag after a delay to allow state to settle
                setTimeout(() => {
                    isResizingRef.current = false;
                }, 200);
            }
            
            const dragEndNodeId = detectDragEndNodeId(changes);
            const changesWithSnapping = applySnappingToChanges(changes, dragEndNodeId);
            
            // First apply React Flow's changes (position, selection, etc.)
            let updatedNodes = applyNodeChanges(changesWithSnapping, nodes);
            
            // Then apply resize changes to ensure dimensions are in all locations
            // This must happen AFTER applyNodeChanges to preserve our dimension updates
            // and ensure dimensions are synced to root, style, and data
            updatedNodes = applyResizeChanges(updatedNodes, changesWithSnapping);
            
            // CRITICAL: Ensure all nodes have dimensions in style for NodeResizer to work
            // NodeResizer REQUIRES style.width and style.height to function
            // BUT: Only sync if dimensions are missing, don't overwrite existing dimensions
            // This prevents resetting dimensions when clicking on nodes or dragging parent nodes
            updatedNodes = updatedNodes.map(node => {
                // Only sync if style dimensions are missing
                // This preserves manually resized dimensions and prevents resetting
                if (!node.style?.width || !node.style?.height) {
                    return syncNodeDimensions(node);
                }
                return node;
            });
            
            setNodes(updatedNodes);
            
            // Persist resize changes when resize ends
            // This works for both new and existing nodes since React Flow handles resize through handleNodesChange
            // CRITICAL: Persist immediately when resize ends to prevent dimension loss when clicking outside
            if (hasResizeEnd) {
                // Get the resized nodes from the updated nodes
                const resizedNodes = updatedNodes.filter(node => {
                    const resizeChange = changesWithSnapping.find(c => c.type === 'resize' && c.id === node.id);
                    return !!resizeChange;
                });
                
                if (resizedNodes.length > 0) {
                    // CRITICAL: Sync dimensions to all locations before persisting
                    const nodesToPersist = resizedNodes.map(node => {
                        const nodeWidth = node.width || node.data?.width || node.style?.width;
                        const nodeHeight = node.height || node.data?.height || node.style?.height;
                        return {
                            ...node,
                            width: nodeWidth,
                            height: nodeHeight,
                            style: {
                                ...node.style,
                                width: nodeWidth,
                                height: nodeHeight,
                            },
                            data: {
                                ...node.data,
                                width: nodeWidth,
                                height: nodeHeight,
                            },
                        };
                    });
                    // Persist immediately to prevent dimension loss
                    // This ensures dimensions are saved before any other operation (like clicking outside)
                    updateOriginalFetchedNodesRef(nodesToPersist);
                }
            }
        },
        [nodes, setNodes, isDeveloperMode, detectDragEndNodeId, applySnappingToChanges, applyResizeChanges, updateOriginalFetchedNodesRef]
    );
    
    // Track previous node dimensions to detect resize changes
    // This prevents the useEffect from running on every node change (like position updates during drag)
    const prevNodeDimensionsRef = useRef(new Map());
    // Track the last known resize state to detect when resize ends
    const lastResizingStateRef = useRef(false);
    
    // Update originalFetchedNodesRef when node dimensions change (but only if not resizing)
    // This ensures resize changes are persisted even if handleNodesChange isn't called with resize changes
    // IMPORTANT: This only updates dimensions, preserving all other properties including parentId
    // CRITICAL: Only runs when dimensions change, not on position changes or parent-child relationship changes
    useEffect(() => {
        if (!isDeveloperMode) {
            return;
        }
        
        // CRITICAL: Skip if originalFetchedNodesRef is empty
        if (originalFetchedNodesRef.current.length === 0) {
            return;
        }
        
        const wasResizing = lastResizingStateRef.current;
        const isResizing = isResizingRef.current;
        lastResizingStateRef.current = isResizing;
        
        // If resizing, don't update tracking - wait for resize to end
        // This ensures we can detect dimension changes when resize ends
        if (isResizing) {
            return;
        }
        
        // If resize just ended (was true, now false), we need to check for dimension changes
        // even if nodes haven't changed in this render cycle
        const resizeJustEnded = wasResizing && !isResizing;
        
        // Check if any node dimensions have actually changed (not just position or parentId changes)
        let hasDimensionChanges = false;
        const dimensionChanges = new Map();
        
        nodes.forEach(node => {
            let prevDims = prevNodeDimensionsRef.current.get(node.id);
            
            // If we don't have previous dimensions, try to get them from originalFetchedNodesRef
            // This ensures we compare against the original stored dimensions, not the current dimensions
            if (!prevDims) {
                const originalNode = originalFetchedNodesRef.current.find(n => n.id === node.id);
                if (originalNode) {
                    const origWidth = Number(originalNode.width || originalNode.data?.width || originalNode.style?.width);
                    const origHeight = Number(originalNode.height || originalNode.data?.height || originalNode.style?.height);
                    if (!isNaN(origWidth) && !isNaN(origHeight)) {
                        prevDims = { width: origWidth, height: origHeight };
                        prevNodeDimensionsRef.current.set(node.id, prevDims);
                    }
                }
            }
            
            // Convert to numbers for accurate comparison (handles string vs number mismatches)
            const currentWidth = Number(node.width || node.data?.width || node.style?.width);
            const currentHeight = Number(node.height || node.data?.height || node.style?.height);
            
            // Skip if dimensions are invalid
            if (isNaN(currentWidth) || isNaN(currentHeight)) {
                return;
            }
            
            if (!prevDims) {
                // First time seeing this node and no original found, store current dimensions
                prevNodeDimensionsRef.current.set(node.id, { width: currentWidth, height: currentHeight });
                return; // Don't trigger update on first render
            }
            
            // Check if dimensions changed (ignore position, parentId, or other property changes)
            // Compare as numbers to handle type mismatches
            const prevWidth = Number(prevDims.width);
            const prevHeight = Number(prevDims.height);
            
            if (!isNaN(prevWidth) && !isNaN(prevHeight)) {
                if (prevWidth !== currentWidth || prevHeight !== currentHeight) {
                    hasDimensionChanges = true;
                    dimensionChanges.set(node.id, {
                        prev: prevDims,
                        current: { width: currentWidth, height: currentHeight }
                    });
                }
            }
        });
        
        // Only update if dimensions actually changed (not just position or parent-child relationship changes)
        if (!hasDimensionChanges) {
            // Update tracking even if no changes detected, to keep baseline current
            // This handles cases where nodes are updated for other reasons (position, parentId, etc.)
            // BUT: Don't update if resize just ended - we want to preserve the baseline for comparison
            // CRITICAL: Always update tracking to preserve manually resized dimensions
            // This ensures dimensions are preserved when clicking outside or on another node
            nodes.forEach(node => {
                const currentWidth = Number(node.width || node.data?.width || node.style?.width);
                const currentHeight = Number(node.height || node.data?.height || node.style?.height);
                if (!isNaN(currentWidth) && !isNaN(currentHeight)) {
                    prevNodeDimensionsRef.current.set(node.id, { width: currentWidth, height: currentHeight });
                }
            });
            return;
        }
        
        // Small delay to ensure resize flag is cleared and state has settled
        // This prevents interference with parent-child drag operations
        const timeoutId = setTimeout(() => {
            // Double-check that resize is not active (in case it was set during the timeout)
            if (!isResizingRef.current) {
                // Update original fetched nodes with current node dimensions
                // updateOriginalFetchedNodesRef only updates dimensions and preserves all other properties
                // including parentId, position, and all data properties
                updateOriginalFetchedNodesRef(nodes);
                // Update tracking after persisting changes
                nodes.forEach(node => {
                    const currentWidth = Number(node.width || node.data?.width || node.style?.width);
                    const currentHeight = Number(node.height || node.data?.height || node.style?.height);
                    if (!isNaN(currentWidth) && !isNaN(currentHeight)) {
                        prevNodeDimensionsRef.current.set(node.id, { width: currentWidth, height: currentHeight });
                    }
                });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [nodes, isDeveloperMode, updateOriginalFetchedNodesRef]);
    
    // Handle drag start - immediately set dragging node ID for helper lines
    const onNodeDragStart = useCallback((event, node) => {
        if (!isDeveloperMode) return;
        takeSnapshot();
        setDraggingNodeId(node.id);
        setPotentialParentId(null);
    }, [isDeveloperMode, takeSnapshot]);

    // Handle node drag - detect when node is over a potential group/parent node
    const onNodeDrag = useCallback((event, node) => {
        if (!isDeveloperMode) return;

        const currentNodes = getNodes();
        // Use positionAbsolute if available (React Flow provides this), otherwise use position
        const dragPoint = node.positionAbsolute || node.position;

        if (!dragPoint) return;

        // If node has a parent, it's locked by default - but we still allow drag to detect new parent or detach
        // Find potential group/parent node - any node can be a parent
        const potentialParent = findGroupNodeAtPoint(currentNodes, dragPoint, node.id);
        
        if (potentialParent) {
            // Check if this is a valid attachment
            if (potentialParent.id !== node.id && 
                potentialParent.id !== node.parentId &&
                !wouldCreateCircularDependency(currentNodes, node.id, potentialParent.id)) {
                setPotentialParentId(potentialParent.id);
                return;
            }
        }

        // If not over a group node, clear potential parent (will detach if node has parentId)
        setPotentialParentId(null);
    }, [isDeveloperMode, getNodes]);



    // Handle drag stop - implement attach/detach logic for group nodes (any node can be a parent)
    const onNodeDragStop = useCallback((event, node) => {
        if (!isDeveloperMode) return;
        takeSnapshot();
        const currentNodes = getNodes();

        const draggedNode = currentNodes.find(n => n.id === node.id);
        if (!draggedNode) return;

        const hasParent = !!draggedNode.parentId;
        const oldParentId = draggedNode.parentId;

        // ATTACH: Node is dropped over a group/parent node
        if (potentialParentId && potentialParentId !== oldParentId) {
            const newParent = currentNodes.find(n => n.id === potentialParentId);
            
            // Any node without a parent can be a group node
            if (newParent && !newParent.parentId) {
                const draggedAbsolutePos = draggedNode.positionAbsolute || draggedNode.position;
                const parentAbsolutePos = newParent.positionAbsolute || newParent.position;

                if (draggedAbsolutePos && parentAbsolutePos) {
                    let relativePos;
                    
                    // MOVE BETWEEN GROUPS: Convert from old parent's relative to new parent's relative
                    if (oldParentId) {
                        const oldParent = currentNodes.find(n => n.id === oldParentId);
                        if (oldParent) {
                            const oldParentAbsolutePos = oldParent.positionAbsolute || oldParent.position;
                            // Convert: oldRelative -> absolute -> newRelative
                            const absoluteFromOld = relativeToAbsolute(draggedNode.position, oldParentAbsolutePos);
                            relativePos = absoluteToRelative(absoluteFromOld, parentAbsolutePos);
                        } else {
                            relativePos = absoluteToRelative(draggedAbsolutePos, parentAbsolutePos);
                        }
                    } else {
                        // ATTACH: Convert absolute to relative
                        relativePos = absoluteToRelative(draggedAbsolutePos, parentAbsolutePos);
                    }

                    setNodes((nds) => {
                        const updatedNodes = nds.map((n) => {
                            if (n.id === node.id) {
                                return {
                                    ...n,
                                    parentId: potentialParentId,
                                    position: relativePos,
                                    // Automatically lock when node has a parent
                                    extent: 'parent',
                                    data: {
                                        ...n.data,
                                        isAttachedToGroup: true
                                    }
                                };
                            }
                            return n;
                        });
                        
                        // Ensure parent-child ordering
                        const sortedNodes = sortNodesByParentChild(updatedNodes);
                        
                        // Update originalFetchedNodesRef
                        const reParentedNode = sortedNodes.find(n => n.id === node.id);
                        if (reParentedNode) {
                            setTimeout(() => {
                                const finalNodes = getNodes();
                                const finalNode = finalNodes.find(n => n.id === node.id);
                                if (finalNode) {
                                    updateOriginalFetchedNodesRef([finalNode]);
                                }
                            }, 100);
                        }
                        
                        return sortedNodes;
                    });

                    setPotentialParentId(null);
                    setDraggingNodeId(null);
                    return;
                }
            }
        }

        // DETACH: Node with parentId is dropped outside any group
        // Note: Nodes with parents are always locked, but we allow detach by dragging outside
        if (hasParent && !potentialParentId) {
            const oldParent = currentNodes.find(n => n.id === oldParentId);
            
            if (oldParent) {
                const oldParentAbsolutePos = oldParent.positionAbsolute || oldParent.position;
                // Convert relative to absolute
                const absolutePos = relativeToAbsolute(draggedNode.position, oldParentAbsolutePos);

                setNodes((nds) => {
                    const updatedNodes = nds.map((n) => {
                        if (n.id === node.id) {
                            const updated = {
                                ...n,
                                parentId: undefined,
                                position: absolutePos,
                                extent: undefined,
                                data: {
                                    ...n.data,
                                    isAttachedToGroup: false
                                }
                            };
                            return updated;
                        }
                        return n;
                    });
                    
                    // Ensure parent-child ordering
                    const sortedNodes = sortNodesByParentChild(updatedNodes);
                    
                    // Update originalFetchedNodesRef
                    const detachedNode = sortedNodes.find(n => n.id === node.id);
                    if (detachedNode) {
                        setTimeout(() => {
                            const finalNodes = getNodes();
                            const finalNode = finalNodes.find(n => n.id === node.id);
                            if (finalNode) {
                                updateOriginalFetchedNodesRef([finalNode]);
                            }
                        }, 100);
                    }
                    
                    return sortedNodes;
                });

                setPotentialParentId(null);
                setDraggingNodeId(null);
                return;
            }
        }

        // Apply final snap position when drag stops (only if not attaching/detaching)
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
                                        };
                                    }
                                }
                            }
                            return {
                                ...n,
                                position: snappedPosition
                            };
                        }
                        return n;
                    })
                );
            }
        }

        setPotentialParentId(null);
        setDraggingNodeId(null);
    }, [isDeveloperMode, snapNodePosition, setNodes, takeSnapshot, getNodes, updateOriginalFetchedNodesRef, potentialParentId]);


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
            
            // Force React Flow to measure the node when selected
            // This ensures NodeResizer works for stored nodes that haven't been dragged yet
            // updateNodeInternals triggers React Flow to measure the node's dimensions
            updateNodeInternals(node.id);
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

    // Ensure selected nodes are measured for NodeResizer to work
    // This fixes the issue where stored nodes can't be resized until they're dragged
    // When a node is dragged, React Flow measures it automatically, but stored nodes need explicit measurement
    // NOTE: Removed 'nodes' from dependencies to prevent infinite loops when nodes update during resize
    // CRITICAL: Only sync dimensions if they're missing, don't overwrite existing dimensions
    // This prevents resetting dimensions when clicking on a manually resized node
    useEffect(() => {
        if (selectedNodeId && isDeveloperMode && !isResizingRef.current) {
            // Use a ref to get the current node without adding nodes to dependencies
            // This prevents infinite loops when nodes update
            const timeoutId = setTimeout(() => {
                // Get the current node from the nodes state using a function
                setNodes(currentNodes => {
                    const selectedNode = currentNodes.find(n => n.id === selectedNodeId);
                    if (selectedNode) {
                        // CRITICAL: Only sync if dimensions are completely missing
                        // Don't overwrite existing dimensions - this prevents resetting manually resized nodes
                        if (!selectedNode.style?.width || !selectedNode.style?.height) {
                            // Check if node has dimensions elsewhere before syncing
                            const hasDimensions = selectedNode.width || selectedNode.height || 
                                                  selectedNode.data?.width || selectedNode.data?.height;
                            
                            // CRITICAL: Don't use measured dimensions if node has dimensions in root or data
                            // This prevents resetting manually resized dimensions
                            if (hasDimensions) {
                                const synced = syncNodeDimensions(selectedNode);
                                syncedNodeIdsRef.current.add(selectedNodeId);
                                return currentNodes.map(node => {
                                    if (node.id === selectedNodeId) {
                                        return synced;
                                    }
                                    return node;
                                });
                            }
                        }
                    }
                    return currentNodes;
                });
                
                // Small delay to ensure node is fully rendered before measuring
                setTimeout(() => {
                    updateNodeInternals(selectedNodeId);
                }, 50);
            }, 100);
            
            return () => clearTimeout(timeoutId);
        }
    }, [selectedNodeId, isDeveloperMode, updateNodeInternals, setNodes]);
    
    // CRITICAL: When a node is deselected (selectedNodeId becomes null), ensure its dimensions are preserved
    // This prevents dimension loss when clicking outside or on another node
    const prevSelectedNodeIdRef = useRef(selectedNodeId);
    useEffect(() => {
        // If a node was just deselected (had an ID, now null), persist its dimensions immediately
        if (prevSelectedNodeIdRef.current && !selectedNodeId && isDeveloperMode && !isResizingRef.current) {
            const deselectedNodeId = prevSelectedNodeIdRef.current;
            setNodes(currentNodes => {
                const deselectedNode = currentNodes.find(n => n.id === deselectedNodeId);
                if (deselectedNode) {
                    // CRITICAL: Get dimensions from root first (most reliable), then data, then style
                    // This ensures we use the actual resized dimensions, not stale style dimensions
                    const nodeWidth = deselectedNode.width || deselectedNode.data?.width || deselectedNode.style?.width;
                    const nodeHeight = deselectedNode.height || deselectedNode.data?.height || deselectedNode.style?.height;
                    
                    // CRITICAL: Create a node with dimensions synced to all locations before persisting
                    // This ensures style dimensions match root dimensions
                    const nodeToPersist = {
                        ...deselectedNode,
                        width: nodeWidth,
                        height: nodeHeight,
                        style: {
                            ...deselectedNode.style,
                            width: nodeWidth,
                            height: nodeHeight,
                        },
                        data: {
                            ...deselectedNode.data,
                            width: nodeWidth,
                            height: nodeHeight,
                        },
                    };
                    
                    // CRITICAL: Persist dimensions IMMEDIATELY before updating state
                    // This ensures dimensions are saved before handleTableDataChange can reset them
                    // CRITICAL: Pass nodeToPersist directly - it already has dimensions synced to all locations
                    updateOriginalFetchedNodesRef([nodeToPersist]);
                    
                    // CRITICAL: Update the node in state AFTER persisting to prevent handleTableDataChange from resetting it
                    const updatedNodes = currentNodes.map(node => {
                        if (node.id === deselectedNodeId) {
                            return nodeToPersist;
                        }
                        return node;
                    });
                    
                    return updatedNodes;
                }
                return currentNodes;
            });
        }
        prevSelectedNodeIdRef.current = selectedNodeId;
    }, [selectedNodeId, isDeveloperMode, setNodes, updateOriginalFetchedNodesRef]);
    
    // CRITICAL: Ensure all nodes have dimensions in style when loaded or when developer mode is enabled
    // NodeResizer REQUIRES style.width and style.height to function
    // This ensures existing stored nodes can be resized immediately
    // NOTE: Only sync nodes that haven't been synced yet to prevent infinite loops
    // CRITICAL: Don't reset dimensions for nodes that already have them (manually resized nodes)
    useEffect(() => {
        if (!isDeveloperMode || nodes.length === 0 || isResizingRef.current) {
            return;
        }
        
        // Check if any nodes are missing style dimensions AND haven't been synced yet
        const nodesNeedingSync = nodes.filter(node => {
            // Skip if already synced
            if (syncedNodeIdsRef.current.has(node.id)) {
                return false;
            }
            
            // CRITICAL: Only sync if style dimensions are completely missing
            // If node has dimensions in root level or data, preserve them - don't use measured
            const hasStyleDimensions = node.style?.width && node.style?.height;
            const hasRootDimensions = node.width && node.height;
            const hasDataDimensions = node.data?.width && node.data?.height;
            
            // If node has dimensions anywhere (root, data, or style), don't sync
            // This preserves manually resized dimensions
            if (hasStyleDimensions || hasRootDimensions || hasDataDimensions) {
                // Mark as synced even if it already has dimensions (to avoid re-checking)
                syncedNodeIdsRef.current.add(node.id);
                return false;
            }
            
            // Only sync if dimensions are completely missing
            return true;
        });
        
        if (nodesNeedingSync.length > 0) {
            setNodes(currentNodes => {
                return currentNodes.map(node => {
                    // Only sync nodes that need it to avoid unnecessary updates
                    if (nodesNeedingSync.some(n => n.id === node.id)) {
                        syncedNodeIdsRef.current.add(node.id);
                        return syncNodeDimensions(node);
                    }
                    return node;
                });
            });
        } else {
            // Mark all nodes as synced if none need syncing
            nodes.forEach(node => {
                syncedNodeIdsRef.current.add(node.id);
            });
        }
    }, [nodes.length, isDeveloperMode, setNodes]);

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
                        // CRITICAL: Only update dimensions if config has them, otherwise preserve existing
                        // This prevents resetting manually resized dimensions
                        width: config.data?.width ?? node.width,
                        height: config.data?.height ?? node.height,
                        style: {
                            ...node.style,
                            width: config.data?.width ?? node.style?.width ?? node.width,
                            height: config.data?.height ?? node.style?.height ?? node.height,
                        },
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

    // REMOVED: Duplicate newNode useEffect - node creation is handled by the main newNode useEffect above
    // which properly handles SVG dimensions and default sizes

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
            addFlow(flowData);
            setDeveloperMode(false);

        } catch (error) {
            // Error handling is done by addFlow's onError callback
        }
    };

    const onPaneClick = () => {
        console.log('[onPaneClick] Canvas clicked - current nodes state:', nodes.map(n => ({
            id: n.id,
            parentId: n.parentId,
            position: n.position,
            positionAbsolute: n.positionAbsolute
        })));
        console.log('[onPaneClick] originalFetchedNodesRef state:', originalFetchedNodesRef.current.map(n => ({
            id: n.id,
            parentId: n.parentId,
            position: n.position,
            positionAbsolute: n.positionAbsolute
        })));
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
                    // Check if dropped position is inside a group/parent node
                    const currentNodes = getNodes();
                    const parentAtDrop = findGroupNodeAtPoint(currentNodes, position);
                    
                    let finalPosition = position;
                    let parentId = undefined;
                    
                    if (parentAtDrop && !parentAtDrop.parentId) {
                        // Convert absolute position to relative to parent
                        const parentAbsolutePos = parentAtDrop.positionAbsolute || parentAtDrop.position;
                        if (parentAbsolutePos) {
                            finalPosition = absoluteToRelative(position, parentAbsolutePos);
                            parentId = parentAtDrop.id;
                        }
                    }
                    
                    setSelectedNodeId(null);
                    setSelectedEdgeId(null);
                    setConfig(null);
                    setNewNode({ 
                        ...newNodeData, 
                        position: finalPosition,
                        parentId: parentId
                    });
                    setType(null);
                }
            }
        },
        [screenToFlowPosition, type, handleTemplateDrop, templateDropCounts, setTemplateDropCounts, setNodes, setEdges, setSelectedNodeId, setSelectedEdgeId, setConfig, setNewNode, setType, getNodes]
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
                        // CRITICAL: Ensure all nodes have dimensions in style for NodeResizer to work
                        // NodeResizer REQUIRES style.width and style.height
                        const syncedNode = syncNodeDimensions(node);
                        
                        // Add visual highlight to potential parent during drag
                        if (potentialParentId === syncedNode.id && draggingNodeId) {
                            return {
                                ...syncedNode,
                                style: {
                                    ...syncedNode.style,
                                    border: '3px dashed #009FDF',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 10px rgba(0, 159, 223, 0.5)'
                                }
                            };
                        }
                        return syncedNode;
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