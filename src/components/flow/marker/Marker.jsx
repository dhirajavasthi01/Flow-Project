const Marker = ({ type }) => {
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
                    viewBox="-10 -10 20 20"
                    markerUnits="strokeWidth"
                    orient="auto-start-reverse"
                    refX="-3"
                    refY="0"
                >
                    {!hidePolyline &&
                        <polyline
                            points="-8,-6 0,0 -8,6 -8,-9"
                            style={{
                                strokeWidth: 1.5,
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                            }}
                        />
                    }
                </marker>
            </defs>
        </svg>
    );
};
export default Marker;