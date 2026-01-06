import { memo, useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { NodeResizer, useReactFlow, useStore } from '@xyflow/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { EXTRA_NODE_COLORS } from "../utils";
import { allTagsDataAtom, selectedNodeIdAtom, developerModeAtom, selectedEdgeIdAtom, nodeConfigAtom, failureNodeClickedAtom } from "../../../features/individualDetailWrapper/store/OverviewStore";
import Handles from "../handles/Handles";

export const TextBoxNodeFieldConfig = {
    fields: [
        { label: "Label", name: "label", type: "text" },
        { label: "Text Color", name: "color", type: "color" },
        {
            label: "Orientation",
            name: "orientation",
            type: "select",
            options: [
                { label: "Horizontal", value: "horizontal" },
                { label: "Vertical", value: "vertical" }
            ]
        },
        {
            label: "Target Handles",
            name: "targetHandles",
            type: "multi-select",
        },
        {
            label: "Outlet (Right)",
            name: "numSourceHandlesRight",
        },
        {
            label: "Rotation (Degrees)",
            name: "rotation",
            type: "number",
            min: -360,
            max: 360,
            step: 1
        },
    ],
};

export const TextBoxNodeConfig = {
    name: "Textbox",
    nodeType: "text-box-node",
    type: "textBoxNode",
    position: { x: 0, y: 0 },
    data: {
        numSourceHandlesRight: 1,
        numTargetHandlesTop: 1,
        numSourceHandlesBottom: 1,
        numTargetHandlesLeft: 1,
        label: "Text Box Node",
        color: "#000000",
        linkedTag: null,
        targetHandles: [],
        orientation: "horizontal",
        rotation: 0,
    },
    template: null,
};

export const TextboxNode = memo(({ data, id, selected }) => {
    const selectedId = useAtomValue(selectedNodeIdAtom);
    const isDeveloperMode = useAtomValue(developerModeAtom);
    const { setNodes, screenToFlowPosition, getNodes } = useReactFlow();
    const nodeLookup = useStore((s) => s.nodeLookup);
    const setSelectedNodeId = useSetAtom(selectedNodeIdAtom);
    const setSelectedEdgeId = useSetAtom(selectedEdgeIdAtom);
    const setConfig = useSetAtom(nodeConfigAtom);
    const setFailureNodeClicked = useSetAtom(failureNodeClickedAtom);
    const textRef = useRef(null);
    const containerRef = useRef(null);
     const nodeRef = useRef(null);
    const {
        width: initialWidth = 200,
        height: initialHeight = 100,
        color,
        label,
        numSourceHandlesRight,
        numSourceHandlesBottom,
        numTargetHandlesTop,
        numTargetHandlesLeft,
        linkedTag,
        template,
        targetHandles = [],
        rotation: initialRotation = 0,
    } = data;
    const [rotation, setRotation] = useState(initialRotation);
    const rotationRef = useRef(initialRotation);
    const isRotating = useRef(false);
    const [currentDimensions, setCurrentDimensions] = useState({
        width: initialWidth,
        height: initialHeight
    });
    const [fontSize, setFontSize] = useState(16);

    useEffect(() => {
        setRotation(initialRotation);
        rotationRef.current = initialRotation;
    }, [initialRotation]);
    useEffect(() => {
        // Toggle draggability/selectability only (keep pointer events so we can intercept click in view mode)
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id !== id) return node;
                return {
                    ...node,
                    draggable: isDeveloperMode,
                    selectable: isDeveloperMode,
                };
            })
        );
    }, [isDeveloperMode, id, setNodes]);

    const handleInterceptClick = (e) => {
        if (isDeveloperMode) return; // normal editing behavior

        e.preventDefault();
        e.stopPropagation();

        // Convert click coordinates to flow coordinates
        const point = screenToFlowPosition({ x: e.clientX, y: e.clientY });

        // Find all nodes that contain this point (excluding text boxes and self)
        let bestMatch = null;
        for (const node of nodeLookup.values()) {
            if (!node || node.id === id) continue; // skip self
            if (node.type === 'textBoxNode') continue; // ignore other text boxes

            const w = node.measured?.width || 0;
            const h = node.measured?.height || 0;
            if (w === 0 || h === 0) continue;

            const left = node.internals.positionAbsolute.x;
            const top = node.internals.positionAbsolute.y;
            const right = left + w;
            const bottom = top + h;

            // Check if click point is inside this node
            const contains = point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
            if (!contains) continue;

            // Prefer node with highest z-index
            const z = node.internals?.z || 0;
            if (!bestMatch || z > bestMatch.z) {
                bestMatch = { id: node.id, z, node };
            }
        }

        if (bestMatch) {
            const allNodes = getNodes();
            const targetNode = allNodes.find(n => n.id === bestMatch.id);

            if (targetNode) {
                // Update React Flow selection state
                setNodes((nodes) =>
                    nodes.map((node) => ({
                        ...node,
                        selected: node.id === bestMatch.id
                    }))
                );

                // Update Jotai state
                setFailureNodeClicked(targetNode.data.subSystem);
                setSelectedEdgeId(null);
                setSelectedNodeId(bestMatch.id);
                setConfig(targetNode);
            }
        }
    };

    useEffect(() => {
        setCurrentDimensions({
            width: initialWidth,
            height: initialHeight
        });
    }, [initialWidth, initialHeight]);

    const { bgColor } = EXTRA_NODE_COLORS[template] || {};
    const allTagsDataList = useAtomValue(allTagsDataAtom);
    const tagData = allTagsDataList.find((x) => x.tagId && x.tagId == linkedTag);

    const onResizeEnd = (_, params) => {
        setCurrentDimensions({
            width: params.width,
            height: params.height,
        });

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            width: params.width,
                            height: params.height,
                            rotation: rotationRef.current
                        },
                    };
                }
                return node;
            })
        );
    };
    const startRotation = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        isRotating.current = true;
        const nodeBounds = nodeRef.current.getBoundingClientRect();
        const centerX = nodeBounds.left + nodeBounds.width / 2;
        const centerY = nodeBounds.top + nodeBounds.height / 2;
        const onMouseMove = (moveEvent) => {
            if (!isRotating.current) return;
            const deltaX = moveEvent.clientX - centerX;
            const deltaY = moveEvent.clientY - centerY;
            const angleRadians = Math.atan2(deltaY, deltaX) + Math.PI / 2;
            let newRotationDegrees = angleRadians * (180 / Math.PI);
            if (newRotationDegrees < 0) {
                newRotationDegrees += 360;
            } else if (newRotationDegrees >= 360) {
                newRotationDegrees -= 360;
            }
            setRotation(newRotationDegrees);
            rotationRef.current = newRotationDegrees;
        };
        const onMouseUp = () => {
            if (!isRotating.current) return;
            isRotating.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const finalRotation = rotationRef.current;
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return {
                            ...node,
                            data: { ...node.data, rotation: finalRotation },
                        };
                    }
                    return node;
                })
            );
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [id, setNodes]);
    useLayoutEffect(() => {
        const calculateFontSize = () => {
            if (!textRef.current) return;
            const parentWidth = currentDimensions.width - 4;
            const parentHeight = currentDimensions.height - 4;
            if (parentWidth <= 0 || parentHeight <= 0) {
                setFontSize(1);
                return;
            }

            let low = 1;
            let high = 500;
            let bestFit = 1;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                textRef.current.style.fontSize = `${mid}px`;
                const textWidth = textRef.current.scrollWidth;
                const textHeight = textRef.current.scrollHeight;

                if (textWidth <= parentWidth && textHeight <= parentHeight) {
                    bestFit = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            low = 1;
            high = bestFit;
            let finalFit = 1;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                textRef.current.style.fontSize = `${mid}px`;
                const textHeight = textRef.current.scrollHeight;
                if (textHeight <= parentHeight) {
                    finalFit = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            setFontSize(finalFit);
        };
        calculateFontSize();
    }, [currentDimensions.width, currentDimensions.height, label, tagData]);

    const { orientation = "horizontal"} = data;

    const rawText = tagData ? tagData?.actual ?? "-" : label;

    const textContent = orientation === "vertical"
        ? rawText.split('').join('<br/>')
        : rawText;

    return (
        <div
            ref={nodeRef}
            style={{
                transform: `rotate(${rotation}deg)`,
                width: currentDimensions.width,
                height: currentDimensions.height,
                position: 'relative',
                cursor: 'grab',
            }}
        >
            {selected && (
                <div
                    className="rotate-handle nodrag"
                    onMouseDown={startRotation}
                    style={{
                        position: 'absolute',
                        top: -30,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#0098cfff',
                        cursor: 'grab',
                        zIndex: 10,
                        border: '2px solid white',
                    }}
                >
                    <div style={{ color: 'white', fontSize: '14px', textAlign: 'center', lineHeight: '18px' }}>↻</div>
                </div>
            )}
            <NodeResizer
                isVisible={selected && isDeveloperMode}
                minWidth={20}
                minHeight={10}
                onResizeEnd={onResizeEnd}
            />
            <div
                ref={containerRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                    backgroundColor: bgColor || "transparent",
                    width: '100%',
                    height: '100%',
                    padding: "4px",
                    boxSizing: "border-box",
                    pointerEvents: 'auto',
                    cursor: isDeveloperMode ? 'default' : 'pointer',
                }}
                onMouseDown={handleInterceptClick}
                onClick={handleInterceptClick}
            >
                <p
                    ref={textRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    dangerouslySetInnerHTML={{
                        __html: textContent,
                    }}
                    style={{
                        color: label.toLowerCase().includes("header") ? "red" : color,
                        textAlign: "center",
                        fontSize: `${fontSize}px`,
                        margin: 0,
                        padding: 0,
                        fontWeight: 'bold',
                        display: "block",
                        lineHeight: orientation === 'vertical' ? '1.1' : '1.2',
                        overflow: "hidden",
                        wordBreak: 'break-all',
                        whiteSpace: 'nowrap',
                    }}
                    className="text-uppercase"
                />

                <Handles
                    numSourceHandlesRight={numSourceHandlesRight}
                    numTargetHandlesTop={numTargetHandlesTop}
                    numSourceHandlesBottom={numSourceHandlesBottom}
                    numTargetHandlesLeft={numTargetHandlesLeft}
                    targetHandles={targetHandles}
                    key="textBoxNode"
                />
            </div>
        </div>
    );
});