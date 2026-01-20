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
  useStore,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
} from "../../features/individualDetailWrapper/features/overview/store/OverviewStore";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { SelectionFlowRect } from "./components/selectionFlowRect/SelectionFlowRect";
import FlowPanels from "./components/FlowPanels/FlowPanels";
import {
  processNodesWithTableData as processNodesWithTableDataUtil,
  mergeProcessedNodesWithCurrent,
  createTableDataKey,
} from "./Flow.functions";
import {
  handleFetchedNodesEdgesChange,
  handleTableDataChange,
} from "./flowHelper";
import { updateEdgeWithConfig, createEdge } from "./edgeHelper";
import { useFlowSnapshot } from "./hooks/useFlowSnapshot/useFlowSnapshot";
import {
  generateRandom8DigitNumber,
  hasSubComponentAssetIdMatch,
} from "../../utills/flowUtills/FlowUtills";
import { allNodes, edgeTypes, nodeTypes } from "./utils/NodeEdgeType";

import { useFlowSelection } from "./hooks/useFlowSelection/useFlowSelection";
import { useTemplateManager } from "./hooks/useTemplateManager/useTemplateManager";
import { useTemplateDrop } from "./hooks/useTemplateDrop/useTemplateDrop";
import { useTextBoxClickHandler } from "./hooks/useTextBoxClickHandler/useTextBoxClickHandler";
import { useFlowData } from "./hooks/useFlowData/useFlowData";
import { useOutletContext } from "react-router-dom";
import { AppAtom } from "../../features/individualDetailWrapper/store/IndividualDetailWrapperStore";
import Loader from "../loader/Loader";
import { useHelperLines } from "./hooks/useHelperLines/useHelperLines";
import { HelperLines } from "./components/helperLines/HelperLines";
import { applyResizeChanges } from "./hooks/useNodeResize/useNodeResize";
import {
  handleDragOver,
  handleTemplateDropHelper,
  handleSaveTemplate as handleSaveTemplateHelper,
} from "./templateHelper";
import { showToast } from "../toast/ToastManager";

const Marker = lazy(() => import("ADFPUIVisuals/Marker"));

function Flow(props) {
  const { tableData = [], isLoading: isLoadingFailerMode = false } = props;

  const [newNode, setNewNode] = useAtom(newNodeAtom);
  const [config, setConfig] = useAtom(nodeConfigAtom);
  const [shouldUpdateConfig, setShouldUpdateConfig] = useAtom(updateConfigAtom);
  const [show, toggle] = useAtom(showHandlesAtom);
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom);
  const [legendPosition, setLegendPosition] = useAtom(LegendPositionAtom);
  const [nodeToUpdate, setNodeToUpdate] = useState(null);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [isDeveloperMode, setDeveloperMode] = useAtom(developerModeAtom);
  const [isFailureModeOpen, setIsFailureModeOpen] = useAtom(isFailureModeAtom);
  const setFailureNodeClicked = useSetAtom(failureNodeClickedAtom);
  const [shouldDelete, setShouldDelete] = useAtom(deleteAtom);
  const [type, setType] = useAtom(dragNodeTypeAtom);
  const [nodeToCopy, setNodeToCopy] = useState(null);

  const updateNodeInternals = useUpdateNodeInternals();
  const { screenToFlowPosition, fitView, zoomTo, getNodes } = useReactFlow();
  const selectedEdgeType = useAtom(selectedEdgeTypeAtom);
  const nodeLookup = useStore((s) => s.nodeLookup);
  const handleTextBoxClick = useTextBoxClickHandler();
  const { caseId } = useOutletContext();
  const appData = useAtomValue(AppAtom);
  const isFullView = useAtomValue(isFullViewAtom);
  const setScrollTick = useSetAtom(scrollTickAtom);
  const actualTime = appData?.actualTime;

  // Template functionality
  const { saveTemplate } = useTemplateManager();
  const { handleTemplateDrop } = useTemplateDrop();
  const { snapNodePosition } = useHelperLines();

  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const { selectedNodes: selNodes, allEdges: selEdges } = useFlowSelection(
    nodes,
    edges
  );
  const [templateDropCounts, setTemplateDropCounts] = useState({});
  const [showDrawer, setShowDrawer] = useState(false);
  const [partial, setPartial] = useState(false);

  const {
    nodes: fetchedNodes,
    edges: fetchedEdges,
    isLoading: loadingFlow,
    legendPosition: fetchedLegendPosition,
    isAdding,
    error,
    addFlow,
    saved,
  } = useFlowData(caseId, actualTime);

  const originalFetchedNodesRef = useRef([]);
  const lastProcessedTableDataRef = useRef(null);
  const processNodesWithTableDataRef = useRef(null);

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

  const checkIsDotNode = useCallback(
    (nodeId) => {
      const node = nodeLookup.get(nodeId);
      return (
        node?.type?.includes("dotNode") || node?.nodeType?.includes("dot-node")
      );
    },
    [nodeLookup]
  );

  // Use custom hook for snapshot, undo, snapping, and keyboard handling
  const { takeSnapshot, undo, applySnappingToChanges } = useFlowSnapshot({
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
  }, [newNode, nodes, takeSnapshot]);

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
  }, [
    fetchedNodes,
    fetchedEdges,
    fetchedLegendPosition,
    loadingFlow,
    error,
    saved,
    fitView,
    zoomTo,
    isDeveloperMode,
  ]);

  useEffect(() => {
    //NOSONAR
    handleTableDataChange({
      tableData,
      isDeveloperMode,
      originalFetchedNodesRef,
      lastProcessedTableDataRef,
      processNodesWithTableDataRef,
      setNodes,
    });
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
  }, [
    nodes.length,
    fitViewWithPadding,
    isFailureModeOpen,
    isDeveloperMode,
    isFullView,
  ]);

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
              (edge) => !connectedEdges.includes(edge)
            );
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

  const detectDragEndNodeId = useCallback((changes) => {
    for (const change of changes) {
      if (change.type === "position" && change.dragging === false) {
        return change.id;
      }
    }
    return null;
  }, []);


  const updateOriginalFetchedNodesRef = useCallback((finalNodes) => {
    originalFetchedNodesRef.current = finalNodes.map((node) => {
      const originalNode = originalFetchedNodesRef.current.find(
        (n) => n.id === node.id
      );
      if (!originalNode) return node;
      return {
        ...originalNode,
        style: node.style,
        data: {
          ...originalNode.data,
          width: node.data.width,
          height: node.data.height,
        },
      };
    });
  }, []);

  const handleNodesChange = useCallback(
    (changes) => {
      if (!isDeveloperMode) return;
      const dragEndNodeId = detectDragEndNodeId(changes);
      const changesWithSnapping = applySnappingToChanges(
        changes,
        dragEndNodeId
      );
      const updatedNodes = applyResizeChanges(nodes, changesWithSnapping);
      const finalNodes = applyNodeChanges(changesWithSnapping, updatedNodes);
      setNodes(finalNodes);
      if (changes.some((change) => change.type === "resize")) {
        updateOriginalFetchedNodesRef(finalNodes);
      }
    },
    [
      nodes,
      setNodes,
      isDeveloperMode,
      detectDragEndNodeId,
      applySnappingToChanges,
      applyResizeChanges,
      updateOriginalFetchedNodesRef,
    ]
  );

  const onNodeDragStart = useCallback(
    (event, node) => {
      if (!isDeveloperMode) return;
      takeSnapshot();
      setDraggingNodeId(node.id);
    },
    [isDeveloperMode, takeSnapshot]
  );

  const onNodeDragStop = useCallback(
    (event, node) => {
      if (!isDeveloperMode) return;
      takeSnapshot();
      const isDotNode =
        node.type?.includes("dotNode") || node.nodeType?.includes("dot-node");
      if (!isDotNode && node.position) {
        const snappedPosition = snapNodePosition(node.id, node.position);
        const xDiff = Math.abs(snappedPosition.x - node.position.x);
        const yDiff = Math.abs(snappedPosition.y - node.position.y);
        if ((xDiff > 0.1 || yDiff > 0.1) && xDiff <= 5 && yDiff <= 5) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id ? { ...n, position: snappedPosition } : n
            )
          );
        }
      }
      setDraggingNodeId(null);
    },
    [isDeveloperMode, snapNodePosition, setNodes, takeSnapshot]
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
      takeSnapshot();
      const newEdge = createEdge(params, selectedEdgeType);
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isDeveloperMode, selectedEdgeType, setEdges]
  );

  const onNodeClick = (event, node) => {
    takeSnapshot();
    const HaveFailureMode = tableData.some((item) => {
      return hasSubComponentAssetIdMatch(
        node.data?.subComponentAssetId,
        item.subComponentAssetId
      );
    });
    if (isDeveloperMode || HaveFailureMode) {
      const targetNode = handleTextBoxClick(event, node, {
        nodeLookup,
        isDeveloperMode,
        screenToFlowPosition,
        getNodes,
        setNodes,
      });
      setScrollTick((t) => t + 1);
      setFailureNodeClicked(node.data.subComponentAssetId);
      setIsFailureModeOpen(true);
      if (targetNode) {
        setSelectedEdgeId(null);
        setSelectedNodeId(targetNode.id);
        setConfig(targetNode);
      } else {
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
      configType: "edge",
      style: edge.style || { stroke: "#000000", strokeWidth: 5 },
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
        nodeJson: JSON.stringify(nodes.map((n) => ({ ...n, selected: false }))),
        edgeJson: JSON.stringify(edges.map((e) => ({ ...e, selected: false }))),
        saved: true,
        caseID: caseId,
        active: 0,
        createdOn: new Date().toISOString(),
        legendPosition: legendPosition,
      };
      addFlow(flowData, {
        onSuccess: () => {
          showToast({ message: "Flow diagram saved successfully" });
          console.log("Flow diagram saved successfully");
        },
        onError: (error) => {
          showToast({ message: "Error saving flow diagram" });
          console.error("Error saving flow diagram:", error);
        },
      });
      setDeveloperMode(false);
      toggle(false);
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
    [
      screenToFlowPosition,
      type,
      handleTemplateDrop,
      templateDropCounts,
      setTemplateDropCounts,
      setNodes,
      setEdges,
      allNodes,
      setSelectedNodeId,
      setSelectedEdgeId,
      setConfig,
      setNewNode,
      setType,
    ]
  );

  const handleSaveTemplate = useCallback(() => {
    handleSaveTemplateHelper({
      selNodes,
      selEdges,
      saveTemplate,
      setShowSaveTemplate,
    });
  }, [selNodes, selEdges, saveTemplate, setShowSaveTemplate]);

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      setShowSaveTemplate((selectedNodes || []).length > 0);
    },
    []
  );

  // Create props object to pass to FlowPanels component
  const flowPanelsProps = {
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
  };

  return (
    <div id="react-flow-container" className="h-full w-full relative">
      {isLoadingFailerMode || loadingFlow || !actualTime ? (
        <Loader />
      ) : (
        <>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            defaultEdgeOptions={{ type: "flowingPipeStraightArrow" }}
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
            {isDeveloperMode && (
              <HelperLines draggingNodeId={draggingNodeId} nodes={nodes} />
            )}
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
            <FlowPanels {...flowPanelsProps} />
            <Controls
              position="center-right"
              showInteractive={isDeveloperMode}
              fitViewOptions={{ padding: 0.2 }}
            />
            <Background
              variant={
                props?.showDeveloperMode && isDeveloperMode ? "lines" : "none"
              }
            />
          </ReactFlow>
        </>
      )}
    </div>
  );
}

export default Flow;