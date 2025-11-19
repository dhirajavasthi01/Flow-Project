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

      const gradient = gradients[0];

      const stops = gradient.querySelectorAll('stop');

     

      if (stops.length >= 2) {

        gradientStart = stops[0].getAttribute('stop-color') || null;

        gradientEnd = stops[stops.length - 1].getAttribute('stop-color') || null;

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
