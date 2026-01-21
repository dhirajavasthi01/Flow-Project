/**
 * Finds the best matching node at a given point, excluding text box nodes and the current node
 * @param {Object} point - Point coordinates { x, y }
 * @param {Map} nodeLookup - Map of nodes
 * @param {string} currentNodeId - ID of the current node to exclude
 * @returns {Object|null} Best matching node with id, z, and node properties
 */
export const findBestMatchingNode = (point, nodeLookup, currentNodeId) => {
    let bestMatch = null;
    for (const node of nodeLookup.values()) {
        if (shouldSkipNode(node, currentNodeId)) continue;
        const dimensions = getNodeDimensions(node);
        if (!dimensions) continue;
        if (!isPointInNode(point, node, dimensions)) continue;
        const z = node.internals?.z || 0;
        if (!bestMatch || z > bestMatch.z) {
            bestMatch = { id: node.id, z, node };
        }
    }
    return bestMatch;
};

/**
 * Checks if a node should be skipped in node matching
 * @param {Object} node - Node object
 * @param {string} currentNodeId - ID of the current node
 * @returns {boolean} True if node should be skipped
 */
const shouldSkipNode = (node, currentNodeId) => {
    return !node || node.id === currentNodeId || node.type === 'textBoxNode';
};

/**
 * Gets the dimensions of a node
 * @param {Object} node - Node object
 * @returns {Object|null} Dimensions object with w and h, or null if invalid
 */
const getNodeDimensions = (node) => {
    const w = node.measured?.width || 0;
    const h = node.measured?.height || 0;
    return (w > 0 && h > 0) ? { w, h } : null;
};

/**
 * Checks if a point is inside a node's bounds
 * @param {Object} point - Point coordinates { x, y }
 * @param {Object} node - Node object
 * @param {Object} dimensions - Dimensions object with w and h
 * @returns {boolean} True if point is inside node
 */
const isPointInNode = (point, node, { w, h }) => {
    const left = node.internals.positionAbsolute.x;
    const top = node.internals.positionAbsolute.y;
    return point.x >= left &&
        point.x <= left + w &&
        point.y >= top &&
        point.y <= top + h;
};

/**
 * Binary search to find the optimal font size that fits within target dimensions
 * @param {HTMLElement} textRef - Reference to the text element
 * @param {number} targetWidth - Target width in pixels
 * @param {number} targetHeight - Target height in pixels
 * @param {number} minSize - Minimum font size (default: 1)
 * @param {number} maxSize - Maximum font size (default: 500)
 * @returns {number} Optimal font size
 */
const binarySearchFontSize = (textRef, targetWidth, targetHeight, minSize = 1, maxSize = 500) => {
    let low = minSize;
    let high = maxSize;
    let bestFit = minSize;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        textRef.style.fontSize = `${mid}px`;
        const textWidth = textRef.scrollWidth;
        const textHeight = textRef.scrollHeight;
        if (textWidth <= targetWidth && textHeight <= targetHeight) {
            bestFit = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return bestFit;
};

/**
 * Refines font size to better fit the target height
 * @param {HTMLElement} textRef - Reference to the text element
 * @param {number} targetHeight - Target height in pixels
 * @param {number} initialFit - Initial font size fit
 * @returns {number} Refined font size
 */
const refineFontSizeForHeight = (textRef, targetHeight, initialFit) => {
    let low = 1;
    let high = initialFit;
    let finalFit = 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        textRef.style.fontSize = `${mid}px`;
        const textHeight = textRef.scrollHeight;
        if (textHeight <= targetHeight) {
            finalFit = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return finalFit;
};

/**
 * Calculates the optimal font size for text to fit within given dimensions
 * @param {HTMLElement} textRef - Reference to the text element
 * @param {number} width - Available width in pixels
 * @param {number} height - Available height in pixels
 * @returns {number} Optimal font size
 */
export const calculateOptimalFontSize = (textRef, width, height) => {
    const parentWidth = width - 4;
    const parentHeight = height - 4;
    if (parentWidth <= 0 || parentHeight <= 0) {
        return 1;
    }
    const initialFit = binarySearchFontSize(textRef, parentWidth, parentHeight);
    const finalFit = refineFontSizeForHeight(textRef, parentHeight, initialFit);
    return finalFit;
};

/**
 * Formats text content based on orientation
 * @param {string} rawText - Raw text to format
 * @param {string} orientation - Text orientation ("vertical" or "horizontal")
 * @returns {string} Formatted text with HTML breaks if vertical
 */
export const formatTextContent = (rawText, orientation) => {
    if (orientation === "vertical") {
        return rawText.split('').join('<br/>')
    }
    return rawText
}

/**
 * Gets raw text from tag data or falls back to label
 * @param {Object|null} tagData - Tag data object
 * @param {string} label - Fallback label text
 * @returns {string} Raw text content
 */
export const getRawText = (tagData, label) => {
    if (tagData?.actual) {
        return tagData.actual
    }
    return tagData ? "-" : label
}

/**
 * Calculates rotation angle from center point to mouse position
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} clientX - Mouse X coordinate
 * @param {number} clientY - Mouse Y coordinate
 * @returns {number} Rotation angle in degrees (0-360)
 */
export const calculateAngle = (centerX, centerY, clientX, clientY) => {
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const angleRadians = Math.atan2(deltaY, deltaX) + Math.PI / 2;
    let newRotationDegrees = angleRadians * (180 / Math.PI);
    if (newRotationDegrees < 0) {
        newRotationDegrees += 360;
    } else if (newRotationDegrees >= 360) {
        newRotationDegrees -= 360;
    }
    return newRotationDegrees;
};
