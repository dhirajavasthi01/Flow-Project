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

 

export const extractColorsFromSvg = async (svgPath) => {

  try {

    const response = await fetch(svgPath);

    const svgText = await response.text();

    const parser = new DOMParser();

    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    const svgElement = doc.documentElement;

   

    let gradientStart = null;

    let gradientEnd = null;

    let fillColor = null;

   

    const gradients = svgElement.querySelectorAll('linearGradient, radialGradient');

    if (gradients.length > 0) {

      // Helper function to get stop color (check both attribute and style)
      const getStopColor = (stop) => {
        // First try stop-color attribute
        let color = stop.getAttribute('stop-color');
        if (color) return color.trim();
        
        // If not found, check style attribute
        const style = stop.getAttribute('style');
        if (style) {
          const match = style.match(/stop-color:\s*([^;]+)/i);
          if (match) return match[1].trim();
        }
        
        return null;
      };

      // Process each gradient to find the best one with distinct colors
      let foundDistinctColors = false;
      
      for (let gradIdx = 0; gradIdx < gradients.length && !foundDistinctColors; gradIdx++) {
        const gradient = gradients[gradIdx];
        const stops = Array.from(gradient.querySelectorAll('stop'));

        if (stops.length >= 2) {
          // Get all stop colors
          const stopColors = stops.map(stop => getStopColor(stop)).filter(Boolean);
          
          if (stopColors.length >= 2) {
            const firstColor = stopColors[0];
            const lastColor = stopColors[stopColors.length - 1];
            
            // Normalize colors for comparison (trim and uppercase)
            const normalizedFirst = firstColor?.trim().toUpperCase();
            const normalizedLast = lastColor?.trim().toUpperCase();

            // If first and last stops have the same color, find a different color from middle stops
            // This handles cases like: #ADADAD -> #E3E3E3 -> #ADADAD
            if (normalizedFirst && normalizedLast && normalizedFirst === normalizedLast && stopColors.length >= 3) {
              // Look for a middle stop with a different color
              for (let i = 1; i < stopColors.length - 1; i++) {
                const middleColor = stopColors[i];
                const normalizedMiddle = middleColor?.trim().toUpperCase();
                
                if (middleColor && normalizedMiddle && normalizedMiddle !== normalizedFirst) {
                  // Use the middle color as gradientEnd to show the actual gradient variation
                  gradientStart = firstColor;
                  gradientEnd = middleColor;
                  foundDistinctColors = true;
                  break;
                }
              }
            } else if (normalizedFirst && normalizedLast && normalizedFirst !== normalizedLast) {
              // First and last are already different, use them
              gradientStart = firstColor;
              gradientEnd = lastColor;
              foundDistinctColors = true;
            } else if (!gradientStart && !gradientEnd) {
              // Fallback: use first and last even if same (will be handled later)
              gradientStart = firstColor;
              gradientEnd = lastColor;
            }
          }
        }
      }

    }

   

    if (!gradientStart && !gradientEnd) {

      const filledElements = svgElement.querySelectorAll('[fill]:not([fill="none"]):not([fill^="url"])');

      if (filledElements.length > 0) {

        for (let el of filledElements) {

          const color = el.getAttribute('fill');

          if (color && color !== 'none' && !color.startsWith('url')) {

            fillColor = color;

            break;

          }

        }

      }

    }

   

    return {

      gradientStart: gradientStart || fillColor,

      gradientEnd: gradientEnd || fillColor

    };

   

  } catch (error) {

    console.error('Error extracting SVG colors:', error);

    return {

      gradientStart: null,

      gradientEnd: null

    };

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

};

 

 

export const edgeOptions = [

  {

    name: 'Straight Arrow',

    id: 'flowingPipeStraightArrow',

    bgColor: 'rgba(0, 0, 0, 0.7)',

    legendSortOrder: 1

  },

    {

    name: 'Straight',

    id: 'flowingPipe',

    bgColor: 'rgba(0, 0, 0, 0.7)',

    legendSortOrder: 2

  },

  {

    name: 'Dotted',

    id: 'flowingPipeDotted',

    bgColor: 'rgba(0, 0, 0, 0.7)',

    legendSortOrder: 3

  },

  {

    name: 'Dotted Arrow',

    id: 'flowingPipeDottedArrow',

    bgColor: 'rgba(0, 0, 0, 0.7)',

    legendSortOrder: 4

  },

]

/**
 * Checks if a node should blink based on actualTime and activeSince
 * @param {number} actualTime - Current timestamp in milliseconds
 * @param {number|string} activeSince - Timestamp in milliseconds or date string
 * @param {number} hoursThreshold - Number of hours threshold (default: 24)
 * @returns {object} - Object containing shouldBlink boolean, hoursDifference, and isPast
 */
export const shouldNodeBlink = (actualTime, activeSince, hoursThreshold = 24) => {
  if (!actualTime || !activeSince) {
    return {
      shouldBlink: false,
      hoursDifference: null,
      isPast: false
    };
  }

  try {
    // Convert timestamps to moment objects
    const actualTimeMoment = moment(actualTime);
    const activeSinceMoment = moment(activeSince);
    
    // Calculate difference in hours (positive if activeSince is in the past)
    const hoursDifference = actualTimeMoment.diff(activeSinceMoment, 'hours', true);
    
    // Check if activeSince is in the past and within the threshold
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

/**
 * Normalizes subComponentAssetIds to an array of strings
 * Handles arrays, comma-separated strings, single values, or null/undefined
 * @param {string|number|string[]|number[]} ids - Can be array, comma-separated string, or single ID
 * @returns {string[]} - Array of ID strings
 */
export const normalizeSubComponentAssetIds = (ids) => {
  if (!ids) return [];
  
  // If already an array, normalize to string array
  if (Array.isArray(ids)) {
    return ids.map(id => String(id).trim()).filter(Boolean);
  }
  
  // If string or number, try to parse as comma-separated or use as single value
  const idString = String(ids).trim();
  if (!idString) return [];
  
  // Check if it contains commas (comma-separated string)
  if (idString.includes(',')) {
    return idString.split(',').map(id => id.trim()).filter(Boolean);
  }
  
  // Single value
  return [idString];
};

/**
 * Checks if there's any overlap between two sets of subComponentAssetIds
 * Supports many-to-many matching with arrays, strings, or single values:
 * - If node has [1] and tableData has "1,2", it matches
 * - If node has "1,2" and tableData has [1], it matches
 * - If node has [1,2] and tableData has [2,3], it matches (overlap on "2")
 * @param {string|number|string[]|number[]} nodeSubComponentAssetId - Node's subComponentAssetId
 * @param {string|number|string[]|number[]} tableSubComponentAssetId - Table row's subComponentAssetId
 * @returns {boolean} - True if there's any overlap
 */
export const hasSubComponentAssetIdMatch = (nodeSubComponentAssetId, tableSubComponentAssetId) => {
  if (!nodeSubComponentAssetId || !tableSubComponentAssetId) return false;
  
  const nodeIds = normalizeSubComponentAssetIds(nodeSubComponentAssetId);
  const tableIds = normalizeSubComponentAssetIds(tableSubComponentAssetId);
  
  if (nodeIds.length === 0 || tableIds.length === 0) return false;
  
  // Check for any overlap
  return nodeIds.some(nodeId => tableIds.includes(nodeId));
};