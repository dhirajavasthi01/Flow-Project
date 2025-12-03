import { EDGE_COLORS } from "../utils";

const Marker = ({ type }) => {
    const { borderColor, strokeDasharray } = EDGE_COLORS[type] || {};
    const hidePolyline = type === "flowingPipe" || type === "flowingPipeDotted";

    return (
        <svg
            className="react-flow__marker"
            style={{ position: "absolute", width: 0, height: 0 }}
        >
            <defs>
                <marker
                    id={type}
                    markerWidth="5"
                    markerHeight="5"
                    viewBox="-6 -6 12 12"
                    markerUnits="strokeWidth"
                    orient="auto-start-reverse"
                    refX="0"
                    refY="0"
                >
                    {!hidePolyline &&
                        <polyline
                            points="-5,-4 0,0 -5,4 -5,-4"
                            style={{
                                stroke: borderColor,
                                fill: borderColor,
                                strokeWidth: 1.5,
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeDasharray: strokeDasharray,
                            }}
                        />
                    }
                </marker>

            </defs>
        </svg>
    );
};

export default Marker;
