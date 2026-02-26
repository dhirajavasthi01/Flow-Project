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
  useStore,
  useUpdateNodeInternals,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
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
  AppAtom,
} from '../../features/individualDetailWrapper/features/overview/store/OverviewStore'
import {
  generateRandom8DigitNumber,
  hasSubComponentAssetIdMatch,
  extractDimensionsFromSvgByBBox,
  svgDimensionsCache,
} from '../../utills/flowUtills/FlowUtills'
import FlowPanels from './components/flowPanels/FlowPanels'
import { HelperLines } from './components/helperLines/HelperLines'
import { SelectionFlowRect } from './components/selectionFlowRect/SelectionFlowRect'
import { svgMap } from './components/svgMap/SvgMap'
import { processNodesWithTableData as processNodesWithTableDataUtil } from './Flow.functions'
import { useFlowData } from './hooks/useFlowData/useFlowData'
import { useFlowSelection } from './hooks/useFlowSelection/useFlowSelection'
import { useFlowSnapshot } from './hooks/useFlowSnapshot/useFlowSnapshot'
import { useHelperLines } from './hooks/useHelperLines/useHelperLines'
import {
  applyResizeChanges,
  isResizingRef,
  persistResizeChangesRef,
  syncNodeDimensions,
} from './hooks/useNodeResize/useNodeResize'
import { useTemplateDrop } from './hooks/useTemplateDrop/useTemplateDrop'
import { useTemplateManager } from './hooks/useTemplateManager/useTemplateManager'
import { createEdge, updateEdgeWithConfig } from './utils/edgeHelper/EdgeHelper'
import {
  handleFetchedNodesEdgesChange,
  handleTableDataChange,
} from './utils/flowHelper/FlowHelper'
import {
  addNewNodesToOriginal,
  applyResizedAndReparentedUpdates,
  getResizedNodeIds,
  hasParentOrPositionChanges,
  nodeWithSyncedDimensions,
} from './utils/flowHelper/updateOriginalFetchedNodesUtils'
import {
  allNodes,
  edgeTypes,
  nodeTypes,
} from './utils/nodeEdgeType/NodeEdgeType'
import {
  absoluteToRelative,
  findGroupNodeAtPoint,
  getDescendantIds,
  getNodeDimensionHightAndWidth,
  relativeToAbsolute,
  sortNodesByParentChild,
  wouldCreateCircularDependency,
} from './utils/parentChildUtils/ParentChildUtils'
import {
  getDragStopAction,
  mapNodesWithAttach,
  mapNodesWithDetach,
  mapNodesWithSnap,
} from './utils/nodeDragStopUtils/nodeDragStopUtils'
import {
  handleDragOver,
  handleSaveTemplate as handleSaveTemplateHelper,
  handleTemplateDropHelper,
} from './utils/templateHelper/TemplateHelper'
import {
  callBackIfConditionIsTrue,
  CompareValuesWithSymbol,
  getNestedValue,
  getSafe,
  getValsBaseOnCondition,
  ifElse,
} from '../../utills/nodeNameUtils/nodeNameUtils'
import { storeNodeDimensions } from './utils/nodeSpecialHandling/NodeSpecialHandling'
import Marker from './marker'
function Flow(props) {
  const { tableData = [], isLoading: isLoadingFailerMode = false } = props
  const [newNode, setNewNode] = useAtom(newNodeAtom)
  const [config, setConfig] = useAtom(nodeConfigAtom)
  const [shouldUpdateConfig, setShouldUpdateConfig] = useAtom(updateConfigAtom)
  const [show, toggle] = useAtom(showHandlesAtom)
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)
  const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom)
  const [legendPosition, setLegendPosition] = useAtom(LegendPositionAtom)
  const [nodeToUpdate, setNodeToUpdate] = useState(null)
  const [nodes, setNodes] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])
  const [isDeveloperMode, setDeveloperMode] = useAtom(developerModeAtom)
  const [isFailureModeOpen, setIsFailureModeOpen] = useAtom(isFailureModeAtom)
  const setFailureNodeClicked = useSetAtom(failureNodeClickedAtom)
  const [shouldDelete, setShouldDelete] = useAtom(deleteAtom)
  const [type, setType] = useAtom(dragNodeTypeAtom)
  const [nodeToCopy, setNodeToCopy] = useState(null)
  const updateNodeInternals = useUpdateNodeInternals()
  const { screenToFlowPosition, fitView, zoomTo, getNodes } = useReactFlow()
  const selectedEdgeType = useAtom(selectedEdgeTypeAtom)
  const nodeLookup = useStore((s) => s.nodeLookup)
  const { caseId } = useOutletContext()
  const appData = useAtomValue(AppAtom)
  const isFullView = useAtomValue(isFullViewAtom)
  const setScrollTick = useSetAtom(scrollTickAtom)
  const actualTime = appData?.actualTime
  const { saveTemplate } = useTemplateManager()
  const { handleTemplateDrop } = useTemplateDrop()
  const { snapNodePosition } = useHelperLines()
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const { selectedNodes: selNodes, allEdges: selEdges } = useFlowSelection(
    nodes,
    edges,
  )
  const [templateDropCounts, setTemplateDropCounts] = useState({})
  const [showDrawer, setShowDrawer] = useState(false)
  const [partial, setPartial] = useState(false)
  const [potentialParentId, setPotentialParentId] = useState(null)
  const {
    nodes: fetchedNodes,
    edges: fetchedEdges,
    isLoading: loadingFlow,
    isEnabled,
    legendPosition: fetchedLegendPosition,
    isAdding,
    error,
    addFlow,
    refetch: refetchFlow,
    saved,
  } = useFlowData(caseId, actualTime)
  const originalFetchedNodesRef = useRef([])
  const lastProcessedTableDataRef = useRef(null)
  const processNodesWithTableDataRef = useRef(null)
  const processNodesWithTableData = useCallback(
    (nodesToProcess, originalNodesForReset = null) => {
      return processNodesWithTableDataUtil(
        nodesToProcess,
        originalNodesForReset,
        tableData,
        isDeveloperMode,
        actualTime,
      )
    },
    [tableData, isDeveloperMode, actualTime],
  )

  const checkIsDotNode = useCallback(
    (nodeId) => {
      const node = nodeLookup.get(nodeId)
      return (
        node?.type?.includes('dotNode') || node?.nodeType?.includes('dot-node')
      )
    },
    [nodeLookup],
  )
  // Track which nodes have already been synced to prevent infinite loops
  const syncedNodeIdsRef = useRef(new Set())

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
  })

  // Helper: get node dimension (width or height) using getNestedValue + getSafe for consistent parsing
  const getNodeDimension = useCallback((node, dimension) => {
    const raw =
      getNestedValue(node, dimension) ||
      getNestedValue(node, `data.${dimension}`) ||
      getNestedValue(node, `style.${dimension}`)
    return getSafe(() => Number(raw), NaN)
  }, [])

  useEffect(() => {
    if (getValsBaseOnCondition(!newNode, true, false)) return

    takeSnapshot()
    const newId = `${newNode.nodeType}-${generateRandom8DigitNumber()}`
    const svgPath = getValsBaseOnCondition(
      !!newNode.svgPath,
      newNode.svgPath,
      getValsBaseOnCondition(newNode.nodeType, svgMap[newNode.nodeType], null),
    )

    // Function to create node with dimensions
    // setupSvgViewBox is ONLY called here when dragging from node list
    // After creation, user can resize manually - parent-child relationships are preserved
    const createNodeWithDimensions = (dimensions) => {
      // Helper function to apply dimensions consistently to root, style, and data
      const applyDimensions = (node, width, height) => {
        node.width = width
        node.height = height
        node.style = {
          ...newNode.style,
          ...node.style,
          width,
          height,
        }
        node.data = {
          ...newNode.data,
          ...node.data,
          width,
          height,
        }
        return node
      }

      // Determine dimensions based on priority:
      // 1. Paste operation (newNode.id exists) - preserve original dimensions
      // 2. SVG dimensions (from node list drag) - scale by 10
      // 3. Default dimensions (250x250)
      let finalWidth, finalHeight
      const DEFAULT_SIZE = 250
      if (newNode.id) {
        // Paste operation: preserve original dimensions from newNode
        const existingWidth = getNodeDimensionHightAndWidth(
          newNode,
          'width',
          newNode.data?.width,
        )
        const existingHeight = getNodeDimensionHightAndWidth(
          newNode,
          'height',
          newNode.data?.height,
        )
        finalWidth = getValsBaseOnCondition(
          CompareValuesWithSymbol('&&', existingWidth, existingHeight),
          existingWidth,
          DEFAULT_SIZE,
        )
        finalHeight = getValsBaseOnCondition(
          CompareValuesWithSymbol('&&', existingWidth, existingHeight),
          existingHeight,
          DEFAULT_SIZE,
        )
      } else if (
        CompareValuesWithSymbol('&&', dimensions?.width, dimensions?.height)
      ) {
        // SVG dimensions from node list drag: scale by 10
        finalWidth = dimensions.width * 10
        finalHeight = dimensions.height * 10
      } else {
        // Default dimensions
        finalWidth = DEFAULT_SIZE
        finalHeight = DEFAULT_SIZE
      }

      // Create node with base properties
      const nodeToCreate = {
        ...newNode,
        id: newId,
        parentId: newNode.parentId,
        extent: getValsBaseOnCondition(newNode.parentId, 'parent', undefined),
        data: {
          ...newNode.data,
          isAttachedToGroup: !!newNode.parentId,
        },
      }

      // Apply dimensions to root, style, and data
      applyDimensions(nodeToCreate, finalWidth, finalHeight)

      const newNodeWithDimensions = syncNodeDimensions(nodeToCreate)

      // Mark as synced to prevent re-syncing in the other useEffect
      syncedNodeIdsRef.current.add(newId)

      // CRITICAL: Add new node to originalFetchedNodesRef immediately so dimensions can be persisted
      // This ensures the node exists in originalFetchedNodesRef when it's resized or deselected
      callBackIfConditionIsTrue(
        !originalFetchedNodesRef.current.find((n) => n.id === newId),
        () => {
          originalFetchedNodesRef.current.push(newNodeWithDimensions)
        },
      )

      // Ensure parent-child ordering when adding new node
      const updatedNodes = [...nodes, newNodeWithDimensions]
      const sortedNodes = sortNodesByParentChild(updatedNodes)
      setNodes(sortedNodes)
      setSelectedNodeId(newId)
      setConfig({ ...newNode, id: newId })
      setNewNode(null)
    }

    // Try to get SVG dimensions by measuring bounding box (from cache or load them)
    ifElse(
      !!svgPath,
      () => {
        ifElse(
          svgDimensionsCache.has(svgPath),
          () => {
            const dimensions = svgDimensionsCache.get(svgPath)
            createNodeWithDimensions(dimensions)
          },
          () => {
            extractDimensionsFromSvgByBBox(svgPath)
              .then((dimensions) => createNodeWithDimensions(dimensions))
              .catch(() => createNodeWithDimensions(null))
          },
        )
      },
      () => createNodeWithDimensions(null),
    )
  }, [newNode, nodes, takeSnapshot, getNodeDimension])

  useEffect(() => {
    processNodesWithTableDataRef.current = processNodesWithTableData
  }, [processNodesWithTableData])

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
    })
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
  ])

  useEffect(() => {
    // Don't run handleTableDataChange while resizing to prevent interference
    if (isResizingRef.current) {
      return
    }
    handleTableDataChange({
      tableData,
      isDeveloperMode,
      originalFetchedNodesRef,
      lastProcessedTableDataRef,
      processNodesWithTableDataRef,
      setNodes,
    })
  }, [tableData, isDeveloperMode])

  const fitViewWithPadding = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 })
    }, 100)
  }, [fitView])

  useEffect(() => {
    if (isFullView) {
      fitViewWithPadding()
    }
    if (nodes.length > 0 && !isDeveloperMode) {
      fitViewWithPadding()
    }
  }, [
    nodes.length,
    fitViewWithPadding,
    isFailureModeOpen,
    isDeveloperMode,
    isFullView,
  ])

  useEffect(() => {
    if (shouldDelete) {
      if (selectedNodeId) {
        // When deleting a node, also delete all its children
        const descendantIds = getDescendantIds(nodes, selectedNodeId)
        const idsToDelete = new Set([selectedNodeId, ...descendantIds])
        const newNodes = nodes.filter((node) => !idsToDelete.has(node.id))
        const deletedNodes = nodes.filter((node) => idsToDelete.has(node.id))
        setNodes(newNodes)
        setSelectedNodeId(null)
        setConfig(null)
        setShouldDelete(false)
        setEdges(
          deletedNodes.reduce((acc, node) => {
            const connectedEdges = getConnectedEdges([node], edges)
            const remainingEdges = acc.filter(
              (edge) => !connectedEdges.includes(edge),
            )
            return [...remainingEdges]
          }, edges),
        )
      }
      if (selectedEdgeId) {
        const newEdges = edges.filter((edge) => edge.id !== selectedEdgeId)
        setEdges(newEdges)
        setSelectedEdgeId(null)
        setConfig(null)
        setShouldDelete(false)
      }
    }
  }, [shouldDelete, selectedEdgeId, selectedNodeId, nodes, edges])

  const handleDeleteAll = useCallback(() => {
    if (selNodes.length === 0) return

    // Delete all selected nodes
    const selectedNodeIds = new Set(selNodes.map((node) => node.id))
    const newNodes = nodes.filter((node) => !selectedNodeIds.has(node.id))
    // Get all edges connected to selected nodes
    const connectedEdges = getConnectedEdges(selNodes, edges)
    const connectedEdgeIds = new Set(connectedEdges.map((edge) => edge.id))
    // Also include selected edges
    const selectedEdgeIds = new Set(selEdges.map((edge) => edge.id))
    const allEdgeIdsToDelete = new Set([
      ...connectedEdgeIds,
      ...selectedEdgeIds,
    ])
    // Remove all connected and selected edges
    const newEdges = edges.filter((edge) => !allEdgeIdsToDelete.has(edge.id))
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setConfig(null)
  }, [selNodes, selEdges, nodes, edges, setNodes, setEdges])

  // Helper function to detect drag end node ID
  const detectDragEndNodeId = useCallback((changes) => {
    for (const change of changes) {
      if (change.type === 'position' && change.dragging === false) {
        return change.id
      }
    }
    return null
  }, [])

  // Helper function to update originalFetchedNodesRef when nodes are resized
  // Works for all node types: regular nodes, parent nodes (with children), and child nodes
  const updateOriginalFetchedNodesRef = useCallback((finalNodes) => {
    const originalNodes = originalFetchedNodesRef.current
    const resizedNodeIds = getResizedNodeIds(
      finalNodes,
      originalNodes,
      getNodeDimensionHightAndWidth,
      CompareValuesWithSymbol,
    )

    if (originalNodes.length === 0) {
      originalFetchedNodesRef.current = finalNodes.map((node) =>
        nodeWithSyncedDimensions(node, getNodeDimensionHightAndWidth),
      )
      return
    }

    if (resizedNodeIds.size === 0) {
      const hasChanges = hasParentOrPositionChanges(
        finalNodes,
        originalNodes,
        CompareValuesWithSymbol,
      )
      if (!hasChanges) {
        addNewNodesToOriginal(
          originalFetchedNodesRef,
          finalNodes,
          getNodeDimensionHightAndWidth,
          nodeWithSyncedDimensions,
        )
        return
      }
    }

    originalFetchedNodesRef.current = applyResizedAndReparentedUpdates(
      originalNodes,
      finalNodes,
      resizedNodeIds,
      getNodeDimensionHightAndWidth,
      CompareValuesWithSymbol,
      getValsBaseOnCondition,
    )
    addNewNodesToOriginal(
      originalFetchedNodesRef,
      finalNodes,
      getNodeDimensionHightAndWidth,
      nodeWithSyncedDimensions,
    )
  }, [])

  // Set up the global callback for persisting resize changes
  // This allows useNodeResize to persist changes even when handleNodesChange isn't called
  useEffect(() => {
    persistResizeChangesRef.current = updateOriginalFetchedNodesRef
    return () => {
      persistResizeChangesRef.current = null
    }
  }, [updateOriginalFetchedNodesRef])

  const handleNodesChange = useCallback(
    (changes) => {
      if (!isDeveloperMode) return

      // Log all changes to debug resize issues
      const hasResizeStart = changes.some(
        (change) => change.type === 'resize' && change.resizing === true,
      )
      const hasResizeEnd = changes.some(
        (change) => change.type === 'resize' && change.resizing === false,
      )

      // Track resize state to prevent handleTableDataChange from interfering
      if (hasResizeStart) {
        isResizingRef.current = true
      }
      if (hasResizeEnd) {
        // Clear resize flag after a delay to allow state to settle
        setTimeout(() => {
          isResizingRef.current = false
        }, 200)
      }

      const dragEndNodeId = detectDragEndNodeId(changes)
      const changesWithSnapping = applySnappingToChanges(changes, dragEndNodeId)

      // First apply React Flow's changes (position, selection, etc.)
      let updatedNodes = applyNodeChanges(changesWithSnapping, nodes)

      // Then apply resize changes to ensure dimensions are in all locations
      // This must happen AFTER applyNodeChanges to preserve our dimension updates
      // and ensure dimensions are synced to root, style, and data
      updatedNodes = applyResizeChanges(updatedNodes, changesWithSnapping)

      // CRITICAL: Ensure all nodes have dimensions in style for NodeResizer to work
      // NodeResizer REQUIRES style.width and style.height to function
      // BUT: Only sync if dimensions are missing, don't overwrite existing dimensions
      // This prevents resetting dimensions when clicking on nodes or dragging parent nodes
      updatedNodes = updatedNodes.map((node) => {
        // Only sync if style dimensions are missing
        // This preserves manually resized dimensions and prevents resetting
        if (!node.style?.width || !node.style?.height) {
          return syncNodeDimensions(node)
        }
        return node
      })

      setNodes(updatedNodes)

      // Persist resize changes when resize ends
      // This works for both new and existing nodes since React Flow handles resize through handleNodesChange
      // CRITICAL: Persist immediately when resize ends to prevent dimension loss when clicking outside
      if (hasResizeEnd) {
        // Get the resized nodes from the updated nodes
        const resizedNodes = updatedNodes.filter((node) => {
          const resizeChange = changesWithSnapping.find(
            (c) => c.type === 'resize' && c.id === node.id,
          )
          return !!resizeChange
        })

        if (resizedNodes.length > 0) {
          // CRITICAL: Sync dimensions to all locations before persisting
          const nodesToPersist = resizedNodes.map((node) => {
            const nodeWidth =
              node.width || node.data?.width || node.style?.width
            const nodeHeight =
              node.height || node.data?.height || node.style?.height
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
            }
          })
          // Persist immediately to prevent dimension loss
          // This ensures dimensions are saved before any other operation (like clicking outside)
          updateOriginalFetchedNodesRef(nodesToPersist)
        }
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
    ],
  )

  // Track previous node dimensions to detect resize changes
  // This prevents the useEffect from running on every node change (like position updates during drag)
  const prevNodeDimensionsRef = useRef(new Map())
  // Track the last known resize state to detect when resize ends
  const lastResizingStateRef = useRef(false)

  // Update originalFetchedNodesRef when node dimensions change (but only if not resizing)
  // This ensures resize changes are persisted even if handleNodesChange isn't called with resize changes
  // IMPORTANT: This only updates dimensions, preserving all other properties including parentId
  // CRITICAL: Only runs when dimensions change, not on position changes or parent-child relationship changes
  useEffect(() => {
    if (getValsBaseOnCondition(!isDeveloperMode, true, false)) return
    if (
      getValsBaseOnCondition(
        originalFetchedNodesRef.current.length === 0,
        true,
        false,
      )
    )
      return
    const isResizing = isResizingRef.current
    lastResizingStateRef.current = isResizing

    if (getValsBaseOnCondition(isResizing, true, false)) return

    // Check if any node dimensions have actually changed (not just position or parentId changes)
    let hasDimensionChanges = false
    // eslint-disable-next-line sonarjs/no-unused-collection
    const dimensionChanges = new Map()

    // MOVED THIS FUNCTION OUTSIDE THE FOREACH
    const getValidNodeDimensions = (node, prevDims) => {
      if (prevDims) return null

      // Use a simple for loop instead of find with callback
      let originalNode = null
      for (let i = 0; i < originalFetchedNodesRef.current.length; i++) {
        if (originalFetchedNodesRef.current[i].id === node.id) {
          originalNode = originalFetchedNodesRef.current[i]
          break
        }
      }

      if (!originalNode) return null

      const width = getNodeDimension(originalNode, 'width')
      const height = getNodeDimension(originalNode, 'height')

      const isValid = CompareValuesWithSymbol(
        '&&',
        !isNaN(width),
        !isNaN(height),
      )

      return isValid ? { width, height } : null
    }

    nodes.forEach((node) => {
      let prevDims = prevNodeDimensionsRef.current.get(node.id)

      const dimensions = getValidNodeDimensions(node, prevDims)
      if (dimensions) {
        prevDims = dimensions
        prevNodeDimensionsRef.current.set(node.id, dimensions)
      }

      const currentWidth = getNodeDimension(node, 'width')
      const currentHeight = getNodeDimension(node, 'height')

      if (
        !CompareValuesWithSymbol(
          '&&',
          !isNaN(currentWidth),
          !isNaN(currentHeight),
        )
      )
        return

      if (!prevDims) {
        prevNodeDimensionsRef.current.set(node.id, {
          width: currentWidth,
          height: currentHeight,
        })
        return
      }

      const prevWidth = Number(prevDims.width)
      const prevHeight = Number(prevDims.height)

      if (
        CompareValuesWithSymbol('&&', !isNaN(prevWidth), !isNaN(prevHeight))
      ) {
        if (
          CompareValuesWithSymbol(
            '||',
            prevWidth !== currentWidth,
            prevHeight !== currentHeight,
          )
        ) {
          hasDimensionChanges = true
          dimensionChanges.set(node.id, {
            prev: prevDims,
            current: { width: currentWidth, height: currentHeight },
          })
        }
      }
    })

    return ifElse(
      hasDimensionChanges,
      () => {
        const timeoutId = setTimeout(() => {
          if (!isResizingRef.current) {
            storeNodeDimensions({
              nodes,
              updateOriginalFetchedNodesRef,
              getNodeDimension,
              prevNodeDimensionsRef,
            })
          }
        }, 300)
        return () => clearTimeout(timeoutId)
      },
      () => {
        nodes.forEach((node) => {
          const currentWidth = getNodeDimension(node, 'width')
          const currentHeight = getNodeDimension(node, 'height')
          if (
            CompareValuesWithSymbol(
              '&&',
              !isNaN(currentWidth),
              !isNaN(currentHeight),
            )
          ) {
            prevNodeDimensionsRef.current.set(node.id, {
              width: currentWidth,
              height: currentHeight,
            })
          }
        })
        return undefined
      },
    )
  }, [nodes, isDeveloperMode, updateOriginalFetchedNodesRef, getNodeDimension])

  // Handle drag start - immediately set dragging node ID for helper lines
  const onNodeDragStart = useCallback(
    (event, node) => {
      if (!isDeveloperMode) return
      takeSnapshot()
      setDraggingNodeId(node.id)
      setPotentialParentId(null)
    },
    [isDeveloperMode, takeSnapshot],
  )

  // Handle node drag - detect when node is over a potential group/parent node
  const onNodeDrag = useCallback(
    (event, node) => {
      if (!isDeveloperMode) return

      const currentNodes = getNodes()
      // Use positionAbsolute if available (React Flow provides this), otherwise use position.
      // CRITICAL: For child nodes (node.parentId), positionAbsolute can be missing or stale on the
      // first drag event, so we fall back to relative position and hit-test fails → unwanted detach.
      // Always compute absolute position for children so findGroupNodeAtPoint gets correct coords.
      let dragPoint = node.positionAbsolute || node.position
      if (node.parentId && node.position) {
        const parentNode = currentNodes.find((n) => n.id === node.parentId)
        if (parentNode) {
          const parentAbs = parentNode.positionAbsolute || parentNode.position
          if (parentAbs) {
            dragPoint = relativeToAbsolute(node.position, parentAbs)
          }
        }
      }

      if (!dragPoint) return

      // If node has a parent, it's locked by default - but we still allow drag to detect new parent or detach
      // Find potential group/parent node - any node can be a parent
      const potentialParent = findGroupNodeAtPoint(
        currentNodes,
        dragPoint,
        node.id,
      )

      if (potentialParent) {
        // Check if this is a valid attachment (include current parent so child is not detached when dropped over same parent)
        if (
          potentialParent.id !== node.id &&
          !wouldCreateCircularDependency(
            currentNodes,
            node.id,
            potentialParent.id,
          )
        ) {
          setPotentialParentId(potentialParent.id)
          return
        }
      }

      // If not over a group node, clear potential parent (will detach if node has parentId)
      setPotentialParentId(null)
    },
    [isDeveloperMode, getNodes],
  )

  // Handle drag stop - implement attach/detach logic for group nodes (any node can be a parent)
  const scheduleRefUpdateForNode = useCallback(
    (nodeId) => {
      setTimeout(() => {
        const finalNodes = getNodes()
        const finalNode = finalNodes.find((n) => n.id === nodeId)
        if (finalNode) {
          updateOriginalFetchedNodesRef([finalNode])
        }
      }, 100)
    },
    [getNodes, updateOriginalFetchedNodesRef],
  )

  const applyDragStopAction = useCallback((action, setNodesFn, scheduleRef) => {
    if (action.type === 'attach') {
      setNodesFn((nds) => {
        const sortedNodes = mapNodesWithAttach(
          nds,
          action.nodeId,
          action.potentialParentId,
          action.relativePos,
        )
        scheduleRef(action.nodeId)
        return sortedNodes
      })
      return
    }
    if (action.type === 'detach') {
      setNodesFn((nds) => {
        const sortedNodes = mapNodesWithDetach(
          nds,
          action.nodeId,
          action.absolutePos,
        )
        scheduleRef(action.nodeId)
        return sortedNodes
      })
      return
    }
    if (action.type === 'snap') {
      setNodesFn((nds) =>
        mapNodesWithSnap(nds, action.nodeId, action.snappedPosition),
      )
    }
  }, [])

  const onNodeDragStop = useCallback(
    (event, node) => {
      if (!isDeveloperMode) return
      takeSnapshot()
      const currentNodes = getNodes()
      const draggedNode = currentNodes.find((n) => n.id === node.id)
      if (!draggedNode) return

      const action = getDragStopAction(
        currentNodes,
        draggedNode,
        node.id,
        potentialParentId,
        snapNodePosition,
        node,
      )
      applyDragStopAction(action, setNodes, scheduleRefUpdateForNode)
      setPotentialParentId(null)
      setDraggingNodeId(null)
    },
    [
      isDeveloperMode,
      snapNodePosition,
      setNodes,
      takeSnapshot,
      getNodes,
      potentialParentId,
      scheduleRefUpdateForNode,
      applyDragStopAction,
    ],
  )

  const handleEdgesChange = useCallback(
    (changes) => {
      if (!isDeveloperMode) return
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setEdges, isDeveloperMode],
  )

  const onConnect = useCallback(
    (params) => {
      if (!isDeveloperMode) return
      takeSnapshot()
      const newEdge = createEdge(params, selectedEdgeType)
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [isDeveloperMode, selectedEdgeType, setEdges],
  )

  const onNodeClick = (event, node) => {
    takeSnapshot()
    const HaveFailureMode = tableData.some((item) => {
      return hasSubComponentAssetIdMatch(
        node.data?.subComponentAssetId,
        item.subComponentAssetId,
      )
    })
    if (isDeveloperMode || HaveFailureMode) {
      setScrollTick((t) => t + 1)
      setFailureNodeClicked(node.data.subComponentAssetId)
      setIsFailureModeOpen(true)
      // Default selection behavior
      setSelectedNodeId(node.id)
      setSelectedEdgeId(null)
      setConfig(node)

      // Force React Flow to measure the node when selected
      // This ensures NodeResizer works for stored nodes that haven't been dragged yet
      // updateNodeInternals triggers React Flow to measure the node's dimensions
      updateNodeInternals(node.id)
    }
  }

  const onEdgeClick = (event, edge) => {
    if (!isDeveloperMode) return
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
    setConfig({
      ...edge,
      configType: 'edge',
      style: edge.style || { stroke: '#000000', strokeWidth: 5 },
    })
  }

  useEffect(() => {
    if (nodeToUpdate) {
      updateNodeInternals(nodeToUpdate)
      setNodeToUpdate(null)
    }
  }, [nodeToUpdate])
  useEffect(() => {
    if (nodeToUpdate) {
      updateNodeInternals(nodeToUpdate)
      setNodeToUpdate(null)
    }
  }, [nodeToUpdate])

  // Ensure selected nodes are measured for NodeResizer to work
  // This fixes the issue where stored nodes can't be resized until they're dragged
  // When a node is dragged, React Flow measures it automatically, but stored nodes need explicit measurement
  // NOTE: Removed 'nodes' from dependencies to prevent infinite loops when nodes update during resize
  // CRITICAL: Only sync dimensions if they're missing, don't overwrite existing dimensions
  // This prevents resetting dimensions when clicking on a manually resized node

  // Helper function to check if a node needs dimension syncing
  const shouldSyncNodeDimensions = useCallback((node) => {
    // CRITICAL: Only sync if dimensions are completely missing
    // Don't overwrite existing dimensions - this prevents resetting manually resized nodes
    if (node.style?.width && node.style?.height) {
      return false
    }

    // Check if node has dimensions elsewhere before syncing
    const hasDimensions =
      node.width || node.height || node.data?.width || node.data?.height

    // CRITICAL: Don't use measured dimensions if node has dimensions in root or data
    // This prevents resetting manually resized dimensions
    return !!hasDimensions
  }, [])

  // Helper function to update nodes with synced dimensions
  const updateNodeWithSyncedDimensions = useCallback(
    (currentNodes, nodeId) => {
      const selectedNode = currentNodes.find((n) => n.id === nodeId)
      if (!selectedNode) {
        return currentNodes
      }

      if (!shouldSyncNodeDimensions(selectedNode)) {
        return currentNodes
      }

      const synced = syncNodeDimensions(selectedNode)
      syncedNodeIdsRef.current.add(nodeId)
      return currentNodes.map((node) => (node.id === nodeId ? synced : node))
    },
    [shouldSyncNodeDimensions],
  )

  // Helper function to handle node measurement after sync
  const scheduleNodeMeasurement = useCallback(
    (nodeId) => {
      // Small delay to ensure node is fully rendered before measuring
      setTimeout(() => {
        updateNodeInternals(nodeId)
      }, 50)
    },
    [updateNodeInternals],
  )

  useEffect(() => {
    if (!selectedNodeId || !isDeveloperMode || isResizingRef.current) {
      return
    }

    // Use a ref to get the current node without adding nodes to dependencies
    // This prevents infinite loops when nodes update
    const timeoutId = setTimeout(() => {
      setNodes((currentNodes) =>
        updateNodeWithSyncedDimensions(currentNodes, selectedNodeId),
      )
      scheduleNodeMeasurement(selectedNodeId)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [
    selectedNodeId,
    isDeveloperMode,
    setNodes,
    updateNodeWithSyncedDimensions,
    scheduleNodeMeasurement,
  ])

  // CRITICAL: When a node is deselected (selectedNodeId becomes null), ensure its dimensions are preserved
  // This prevents dimension loss when clicking outside or on another node
  const prevSelectedNodeIdRef = useRef(selectedNodeId)
  useEffect(() => {
    // If a node was just deselected (had an ID, now null), persist its dimensions immediately
    if (
      prevSelectedNodeIdRef.current &&
      !selectedNodeId &&
      isDeveloperMode &&
      !isResizingRef.current
    ) {
      const deselectedNodeId = prevSelectedNodeIdRef.current
      setNodes((currentNodes) => {
        const deselectedNode = currentNodes.find(
          (n) => n.id === deselectedNodeId,
        )
        if (deselectedNode) {
          // CRITICAL: Get dimensions from root first (most reliable), then data, then style
          // This ensures we use the actual resized dimensions, not stale style dimensions
          const nodeWidth =
            deselectedNode.width ||
            deselectedNode.data?.width ||
            deselectedNode.style?.width
          const nodeHeight =
            deselectedNode.height ||
            deselectedNode.data?.height ||
            deselectedNode.style?.height

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
          }

          // CRITICAL: Persist dimensions IMMEDIATELY before updating state
          // This ensures dimensions are saved before handleTableDataChange can reset them
          // CRITICAL: Pass nodeToPersist directly - it already has dimensions synced to all locations
          updateOriginalFetchedNodesRef([nodeToPersist])

          // CRITICAL: Update the node in state AFTER persisting to prevent handleTableDataChange from resetting it
          const updatedNodes = currentNodes.map((node) => {
            if (node.id === deselectedNodeId) {
              return nodeToPersist
            }
            return node
          })

          return updatedNodes
        }
        return currentNodes
      })
    }
    prevSelectedNodeIdRef.current = selectedNodeId
  }, [selectedNodeId, isDeveloperMode, setNodes, updateOriginalFetchedNodesRef])

  // CRITICAL: Ensure all nodes have dimensions in style when loaded or when developer mode is enabled
  // NodeResizer REQUIRES style.width and style.height to function
  // This ensures existing stored nodes can be resized immediately
  // NOTE: Only sync nodes that haven't been synced yet to prevent infinite loops
  // CRITICAL: Don't reset dimensions for nodes that already have them (manually resized nodes)

  // Helper function to check if a node needs dimension syncing
  const nodeNeedsSync = useCallback((node) => {
    // Skip if already synced
    if (syncedNodeIdsRef.current.has(node.id)) {
      return false
    }

    // CRITICAL: Only sync if style dimensions are completely missing
    // If node has dimensions in root level or data, preserve them - don't use measured
    const hasStyleDimensions = node.style?.width && node.style?.height
    const hasRootDimensions = node.width && node.height
    const hasDataDimensions = node.data?.width && node.data?.height

    // If node has dimensions anywhere (root, data, or style), don't sync
    // This preserves manually resized dimensions
    if (hasStyleDimensions || hasRootDimensions || hasDataDimensions) {
      // Mark as synced even if it already has dimensions (to avoid re-checking)
      syncedNodeIdsRef.current.add(node.id)
      return false
    }

    // Only sync if dimensions are completely missing
    return true
  }, [])

  // Helper function to mark all nodes as synced
  const markAllNodesAsSynced = useCallback((nodeList) => {
    nodeList.forEach((node) => {
      syncedNodeIdsRef.current.add(node.id)
    })
  }, [])

  useEffect(() => {
    if (!isDeveloperMode || nodes.length === 0 || isResizingRef.current) {
      return
    }

    // Check if any nodes are missing style dimensions AND haven't been synced yet
    const nodesNeedingSync = nodes.filter(nodeNeedsSync)

    if (nodesNeedingSync.length > 0) {
      const nodeIdsToSync = new Set(nodesNeedingSync.map((n) => n.id))
      setNodes((currentNodes) => {
        return currentNodes.map((node) => {
          // Only sync nodes that need it to avoid unnecessary updates
          if (nodeIdsToSync.has(node.id)) {
            syncedNodeIdsRef.current.add(node.id)
            return syncNodeDimensions(node)
          }
          return node
        })
      })
    } else {
      // Mark all nodes as synced if none need syncing
      markAllNodesAsSynced(nodes)
    }
  }, [
    nodes.length,
    isDeveloperMode,
    setNodes,
    nodeNeedsSync,
    markAllNodesAsSynced,
  ])

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
                height:
                  config.data?.height ?? node.style?.height ?? node.height,
              },
            }
          : node,
      )
      setNodeToUpdate(selectedNodeId)
      setNodes(updatedNodes)
      setSelectedNodeId(null)
      setShouldUpdateConfig(false)
    }
  }, [shouldUpdateConfig, config, nodes, selectedNodeId])

  useEffect(() => {
    if (shouldUpdateConfig && selectedEdgeId) {
      const updatedEdges = updateEdgeWithConfig(edges, selectedEdgeId, config)
      setEdges(updatedEdges)
      setSelectedEdgeId(null)
      setShouldUpdateConfig(false)
    }
  }, [shouldUpdateConfig, config, edges, selectedEdgeId])

  // REMOVED: Duplicate newNode useEffect - node creation is handled by the main newNode useEffect above
  // which properly handles SVG dimensions and default sizes

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
      }
      addFlow(flowData, {
        onSuccess: () => {
          originalFetchedNodesRef.current = []
          refetchFlow()
          setDeveloperMode(false)
          toggle(false)
        },
        onError: (error) => {
          console.error('Error saving flow diagram:', error)
        },
      })
    } catch (error) {
      console.error('Error saving flow diagram:', error)
    }
  }

  const onPaneClick = () => {
    setConfig(null)
    setSelectedEdgeId(null)
    setSelectedNodeId(null)
  }

  const onDragOver = useCallback((event) => {
    handleDragOver(event)
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      // Try to handle template drop first
      const isTemplateDrop = handleTemplateDropHelper({
        event,
        screenToFlowPosition,
        handleTemplateDrop,
        templateDropCounts,
        setTemplateDropCounts,
        setNodes,
        setEdges,
        takeSnapshot,
      })
      // If it wasn't a template drop, handle regular node drop
      if (!isTemplateDrop) {
        if (!type || !position) {
          return
        }
        const newNodeData = allNodes.find((x) => x.type === type)
        if (newNodeData) {
          // Check if dropped position is inside a group/parent node
          const currentNodes = getNodes()
          const parentAtDrop = findGroupNodeAtPoint(currentNodes, position)

          let finalPosition = position
          let parentId = undefined

          if (parentAtDrop && !parentAtDrop.parentId) {
            // Convert absolute position to relative to parent
            const parentAbsolutePos =
              parentAtDrop.positionAbsolute || parentAtDrop.position
            if (parentAbsolutePos) {
              finalPosition = absoluteToRelative(position, parentAbsolutePos)
              parentId = parentAtDrop.id
            }
          }

          setSelectedNodeId(null)
          setSelectedEdgeId(null)
          setConfig(null)
          setNewNode({
            ...newNodeData,
            position: finalPosition,
            parentId: parentId,
          })
          setType(null)
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
      setSelectedNodeId,
      setSelectedEdgeId,
      setConfig,
      setNewNode,
      setType,
      getNodes,
      takeSnapshot,
    ],
  )

  const handleSaveTemplate = useCallback(() => {
    handleSaveTemplateHelper({
      selNodes,
      selEdges,
      saveTemplate,
      setShowSaveTemplate,
    })
  }, [selNodes, selEdges, saveTemplate, setShowSaveTemplate])

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    setShowSaveTemplate((selectedNodes || []).length > 0)
  }, [])
  return (
    <div id='react-flow-container' className='h-full w-full relative'>
      {isLoadingFailerMode && loadingFlow && !isEnabled ? (
        <Loader />
      ) : (
        <>
          <ReactFlow
            nodes={nodes.map((node) => {
              // CRITICAL: Ensure all nodes have dimensions in style for NodeResizer to work
              // NodeResizer REQUIRES style.width and style.height
              const syncedNode = syncNodeDimensions(node)

              // Add visual highlight to potential parent during drag
              if (potentialParentId === syncedNode.id && draggingNodeId) {
                return {
                  ...syncedNode,
                  style: {
                    ...syncedNode.style,
                    border: '1px dashed #009FDF',
                    borderRadius: '4px',
                    boxShadow: '0 0 10px rgba(0, 159, 223, 0.5)',
                  },
                }
              }
              return syncedNode
            })}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onNodeDrag={onNodeDrag}
            defaultEdgeOptions={{
              style: { strokeWidth: 5, stroke: '#000' },
              type: 'flowingPipeStraightArrow',
            }}
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
            multiSelectionKeyCode='Control'
            selectionOnDrag={isDeveloperMode}
            selectionMode='partial'
            onInit={fitViewWithPadding}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{ backgroundColor: '#FFFFFF' }}
          >
            {partial && <SelectionFlowRect partial={partial} />}
            {isDeveloperMode && !isFullView && (
              <HelperLines draggingNodeId={draggingNodeId} nodes={nodes} />
            )}
            <Suspense fallback={null}>
              <Marker type='flowingPipeStraightArrow' />
            </Suspense>
            <Suspense fallback={null}>
              <Marker type='flowingPipe' />
            </Suspense>
            <Suspense fallback={null}>
              <Marker type='flowingPipeDotted' />
            </Suspense>
            <Suspense fallback={null}>
              <Marker type='flowingPipeDottedArrow' />
            </Suspense>
            <FlowPanels
              {...{
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
                handleDeleteAll,
              }}
            />
            <Controls
              position='center-right'
              showInteractive={isDeveloperMode}
              fitViewOptions={{ padding: 0.2 }}
            />
            <Background
              variant={
                props?.showDeveloperMode && isDeveloperMode ? 'lines' : 'none'
              }
            />
          </ReactFlow>
        </>
      )}
    </div>
  )
}
export default Flow
