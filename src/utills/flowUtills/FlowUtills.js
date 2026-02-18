import getStroke from "perfect-freehand";
import moment from "moment";
export const pathOptions = {
  size: 7,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: {
    taper: 0,
    easing: (t) => t,
    cap: true,
  },
  end: {
    taper: 0.1,
    easing: (t) => t,
    cap: true,
  },
};
export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, ",", (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}
export function pointsToPath(points, zoom = 1) {
  const stroke = getStroke(points, {
    ...pathOptions,
    size: pathOptions.size * zoom,
  });
  return getSvgPathFromStroke(stroke);
}
export function generateRandom8DigitNumber() {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % 90000000 + 10000000;
}

// Cache for SVG dimensions to avoid repeated fetches
export const svgDimensionsCache = new Map();

/**
 * Measures SVG bounding box and calculates dimensions
 * This is ONLY called when dragging a node from the node list
 * NOTE: We don't modify the actual rendered SVG - we only measure for dimension extraction
 * @param {SVGElement} svgElement - The SVG element to measure (parsed, not in DOM)
 * @returns {Object|null} - Returns {width, height, viewBox} or null if measurement fails
 */
export const setupSvgViewBox = (svgElement) => {
  try {
    // Create a temporary SVG element in the DOM to measure bounding box
    // This is necessary because getBBox() only works on elements in the DOM
    const tempSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    tempSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    Object.assign(tempSvg.style, {
      position: "absolute",
      visibility: "hidden",
      width: "0",
      height: "0",
    });

    document.body.appendChild(tempSvg);

    // Clone all child nodes from the parsed SVG to measure
    Array.from(svgElement.childNodes).forEach((node) =>
      tempSvg.appendChild(node.cloneNode(true))
    );

    // Measure the bounding box
    const bbox = tempSvg.getBBox();
    document.body.removeChild(tempSvg);

    const padding = 0.2;
    const viewBoxX = bbox.x - padding;
    const viewBoxY = bbox.y - padding;
    const viewBoxWidth = bbox.width + 2 * padding;
    const viewBoxHeight = bbox.height + 2 * padding;
    
    // Calculate viewBox string (but don't modify the original SVG element)
    // The original SVG element is only in memory (parsed), not in the DOM
    // We return the viewBox info but don't apply it to avoid affecting rendered SVGs
    const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;

    return {
      width: viewBoxWidth,
      height: viewBoxHeight,
      viewBox: viewBox
    };
  } catch (error) {
    console.error('Error measuring SVG bounding box:', error);
    return null;
  }
};

/**
 * Extracts dimensions from SVG by measuring its bounding box and sets up viewBox
 * This is ONLY called when dragging a node from the node list
 * @param {string} svgPath - Path to the SVG file
 * @returns {Promise<{width: number, height: number, modifiedSvgText?: string} | null>} - Dimensions and optionally modified SVG text
 */
export const extractDimensionsFromSvgByBBox = async (svgPath) => {
  if (!svgPath) return null;
  
  // Check cache first
  if (svgDimensionsCache.has(svgPath)) {
    return svgDimensionsCache.get(svgPath);
  }
  
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (!svgElement) {
      return null;
    }
    
    // Use setupSvgViewBox to measure bounding box (doesn't modify the parsed SVG)
    // This ONLY happens when dragging from node list, not during resize
    const dimensions = setupSvgViewBox(svgElement);
    
    if (dimensions && dimensions.width && dimensions.height) {
      // Store dimensions and viewBox info, but don't modify the actual SVG file
      // The rendered SVG will use its original viewBox from the file
      // We only use these dimensions to set the node's initial size
      const result = {
        width: dimensions.width,
        height: dimensions.height,
        viewBox: dimensions.viewBox
      };
      
      // Cache the dimensions
      svgDimensionsCache.set(svgPath, result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting SVG dimensions by bounding box:', error);
    return null;
  }
};

const getStopColorFromElement = (stop) => {
  const color = stop.getAttribute('stop-color');
  if (color) return color.trim();
  const style = stop.getAttribute('style');
  const match = style?.match(/stop-color:\s*([^;]+)/i);
  return match ? match[1].trim() : null;
};

const extractGradientColorsFromStops = (stopColors) => {
  const firstColor = stopColors[0];
  const lastColor = stopColors[stopColors.length - 1];
  const normalizedFirst = firstColor?.trim().toUpperCase();
  const normalizedLast = lastColor?.trim().toUpperCase();

  const hasSameEndpoints = normalizedFirst && normalizedLast && normalizedFirst === normalizedLast;
  if (hasSameEndpoints && stopColors.length >= 3) {
    const distinctMiddle = stopColors.slice(1, -1).find((c) => {
      const n = c?.trim().toUpperCase();
      return n && n !== normalizedFirst;
    });
    if (distinctMiddle) return { gradientStart: firstColor, gradientEnd: distinctMiddle, isDistinct: true };
  }

  if (normalizedFirst && normalizedLast && normalizedFirst !== normalizedLast) {
    return { gradientStart: firstColor, gradientEnd: lastColor, isDistinct: true };
  }

  return { gradientStart: firstColor, gradientEnd: lastColor, isDistinct: false };
};

const findGradientColors = (gradients) => {
  let fallback = null;
  for (const gradient of gradients) {
    const stops = Array.from(gradient.querySelectorAll('stop'));
    const stopColors = stops.map((s) => getStopColorFromElement(s)).filter(Boolean);

    if (stops.length >= 2 && stopColors.length >= 2) {
      const result = extractGradientColorsFromStops(stopColors);
      if (result.isDistinct) return { gradientStart: result.gradientStart, gradientEnd: result.gradientEnd };
      if (!fallback) fallback = result;
    }
  }
  return fallback;
};

const findFillColor = (svgElement) => {
  const filled = svgElement.querySelectorAll('[fill]:not([fill="none"]):not([fill^="url"])');
  for (const element of filled) {
    const color = element.getAttribute('fill');
    if (color && color !== 'none' && !color.startsWith('url')) return color;
  }
  return null;
};

export const extractColorsFromSvg = async (svgPath) => {
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svgElement = doc.documentElement;

    const gradients = svgElement.querySelectorAll('linearGradient, radialGradient');
    const gradientColors = gradients.length > 0 ? findGradientColors(gradients) : null;
    const fillColor = !gradientColors ? findFillColor(svgElement) : null;

    const baseColor = gradientColors?.gradientStart ?? fillColor;
    const endColor = gradientColors?.gradientEnd ?? fillColor;

    return { gradientStart: baseColor, gradientEnd: endColor };
  } catch (error) {
    console.error('Error extracting SVG colors:', error);
    return { gradientStart: null, gradientEnd: null };
  }
};
export const EXTRA_NODE_COLORS = {
  gradient: ["#ffffff", "#d3d3d3"],
  "Green": {
    bgColor: "rgba(181, 213, 167, 0.8)",
    borderColor: "rgb(181, 213, 167)",
  },
  "Blue": {
    bgColor: "rgba(91, 155, 213, 0.8)",
    borderColor: "rgb(91, 155, 213)",
  },
};
export const getNodeGradient = () => EXTRA_NODE_COLORS.gradient;
export const getGradientCSS = (colors) => {
  if (!colors || colors.length < 2) return colors[0] || "#ffffff";
  return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
};
export const text_box_resources = [
  {
    name: 'Green',
    id: 'Green',
  },
  {
    name: 'Blue',
    id: 'Blue',
  },
]
const NETWORK_COLOUR_OPTIONS = {
  default: {
    bgColor: '#ffffff',
    borderColor: '#000000',
  },
  fuel: {
    bgColor: 'rgba(255, 0, 0, 0.5)',
    borderColor: 'red',
  },
  power: {
    bgColor: 'rgba(169, 169, 169, 0.5)',
    borderColor: 'gray',
  },
  hp: {
    bgColor: 'rgba(255, 165, 0, 0.5)',
    borderColor: 'orange',
  },
  mp: {
    bgColor: 'rgba(255, 255, 0, 0.5)',
    borderColor: 'rgb(255, 255, 0)',
  },
  lp: {
    bgColor: 'rgba(0, 0, 255, 0.5)',
    borderColor: 'blue',
  },
  water: {
    bgColor: 'rgba(154, 194, 246, 0.5)',
    borderColor: 'rgb(154, 194, 246)',
  },
  suspect: {
    bgColor: 'rgba(104, 52, 155, 0.5)',
    borderColor: 'rgb(104, 52, 155)',
  },
  clean: {
    bgColor: 'rgba(79, 113, 190, 0.5)',
    borderColor: 'rgb(79, 113, 190)',
  },
  vhp: {
    bgColor: 'rgba(255, 102, 0, 0.5)',
    borderColor: 'rgb(255, 102, 0)',
  },
  air: {
    bgColor: 'rgba(153, 173, 170, 0.5)',
    borderColor: 'rgb(153, 173, 170)',
  },
  coolingWater: {
    bgColor: 'rgba(66, 197, 245, 0.5)',
    borderColor: 'rgb(66, 197, 245)',
  },
  dotted: {
    borderColor: '#000000',
    strokeDasharray: '5,5',
  },
  dottedArrow: {
    borderColor: '#000000',
    strokeDasharray: '5,5',
  },
  straightArrow: {
    borderColor: '#000000',
  },
  straight: {
    borderColor: '#000000',
  },
};
export const EDGE_COLORS = {
  flowingPipeStraightArrow: NETWORK_COLOUR_OPTIONS.straightArrow,
  flowingPipeStraight: NETWORK_COLOUR_OPTIONS.straight,
  flowingPipeDotted: NETWORK_COLOUR_OPTIONS.dotted,
  flowingPipeDottedArrow: NETWORK_COLOUR_OPTIONS.dottedArrow,
  straight: NETWORK_COLOUR_OPTIONS.default,
  step: NETWORK_COLOUR_OPTIONS.default,
  smoothstep: NETWORK_COLOUR_OPTIONS.default,
  bezier: NETWORK_COLOUR_OPTIONS.default,
};
export const edgeOptions = [
  {
    name: 'Step Arrow',
    id: 'flowingPipeStraightArrow',
    bgColor: 'rgba(0, 0, 0, 0.7)',
    legendSortOrder: 1,
    type: 'flowingPipeStraightArrow'
  },
  {
    name: 'Step Without Arrow',
    id: 'flowingPipe',
    bgColor: 'rgba(0, 0, 0, 0.7)',
    legendSortOrder: 2,
    type: 'flowingPipeStraightWithoutArrow'
  },
  {
    name: 'Straight Without Arrow',
    id: 'straight',
    bgColor: 'rgba(0, 0, 0, 0.7)',
    type: 'straightArrow',
    legendSortOrder: 3
  },
  {
    name: 'Dotted Without Arrow',
    id: 'flowingPipeDotted',
    bgColor: 'rgba(0, 0, 0, 0.7)',
    legendSortOrder: 4,
    type: 'flowingPipeDotted'
  },
  {
    name: 'Dotted Arrow',
    id: 'flowingPipeDottedArrow',
    bgColor: 'rgba(0, 0, 0, 0.7)',
    legendSortOrder: 5
  },
  // {
  //   name: 'Step Edge',
  //   id: 'step',
  //   type: 'step'
  // },
  // {
  //   name: 'SmoothStep Edge',
  //   id: 'smoothstep',
  //   type: 'smoothstep'
  // },
  {
    name: 'Bezier Edge',
    id: 'bezier',
    type: 'bezier',
    legendSortOrder: 6
  }
]

export const shouldNodeBlink = (actualTime, activeSince, hoursThreshold = 24) => {
  if (!actualTime || !activeSince) {
    return {
      shouldBlink: false,
      hoursDifference: null,
      isPast: false
    };
  }
  try {
    const actualTimeMoment = moment(actualTime);
    const activeSinceMoment = moment(activeSince);
    const hoursDifference = actualTimeMoment.diff(activeSinceMoment, 'hours', true);
    const isPast = hoursDifference > 0;
    const shouldBlink = isPast && hoursDifference < hoursThreshold;
    return {
      shouldBlink,
      hoursDifference: hoursDifference.toFixed(2),
      isPast
    };
  } catch (error) {
    console.error('Error calculating blink status:', error);
    return {
      shouldBlink: false,
      hoursDifference: null,
      isPast: false
    };
  }
};
export const normalizeSubComponentAssetIds = (ids) => {
  if (!ids) return [];
  if (Array.isArray(ids)) {
    return ids.map(id => String(id).trim()).filter(Boolean);
  }
  const idString = String(ids).trim();
  if (!idString) return [];
  if (idString.includes(',')) {
    return idString.split(',').map(id => id.trim()).filter(Boolean);
  }
  return [idString];
};
export const hasSubComponentAssetIdMatch = (nodeSubComponentAssetId, tableSubComponentAssetId) => {
  if (!nodeSubComponentAssetId || !tableSubComponentAssetId) return false;
  const nodeIds = normalizeSubComponentAssetIds(nodeSubComponentAssetId);
  const tableIds = normalizeSubComponentAssetIds(tableSubComponentAssetId);
  if (nodeIds.length === 0 || tableIds.length === 0) return false;
  return nodeIds.some(nodeId => tableIds.includes(nodeId));
};