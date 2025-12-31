export const nodeOverlapsRect = (node, rectTopLeft, rectBottomRight) => {
    const nodeLeft = node.internals.positionAbsolute.x;
    const nodeTop = node.internals.positionAbsolute.y;
    const nodeRight = nodeLeft + (node.measured?.width || 0);
    const nodeBottom = nodeTop + (node.measured?.height || 0);
    return (
        rectTopLeft.x < nodeRight &&
        rectBottomRight.x > nodeLeft &&
        rectTopLeft.y < nodeBottom &&
        rectBottomRight.y > nodeTop
    );
};
export const nodeIsFullyContained = (node, rectTopLeft, rectBottomRight) => {
    const nodeLeft = node.internals.positionAbsolute.x;
    const nodeTop = node.internals.positionAbsolute.y;
    const nodeRight = nodeLeft + (node.measured?.width || 0);
    const nodeBottom = nodeTop + (node.measured?.height || 0);
    return (
        rectTopLeft.x <= nodeLeft &&
        rectBottomRight.x >= nodeRight &&
        rectTopLeft.y <= nodeTop &&
        rectBottomRight.y >= nodeBottom
    );
};