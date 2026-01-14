const svgAnalysisCache = new Map();

/**
 * Analyzes SVG content (text) to determine if it should preserve its original colors.
 *
 * @param {string} svgText - The SVG content as text
 * @returns {boolean} - True if the SVG should preserve its original colors
 */
function analyzeSvgTextForSpecialHandling(svgText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = doc.documentElement;

    /* ---------- Gradient checks ---------- */

    const gradients = svgElement.querySelectorAll(
      "linearGradient, radialGradient"
    );

    if (gradients.length > 0) {
      // Check for gradients with same start/end colors (e.g., RectangularTank)
      for (const gradient of gradients) {
        const stops = Array.from(gradient.querySelectorAll("stop"));

        if (stops.length >= 3) {
          const getStopColor = (stop) => {
            let color = stop.getAttribute("stop-color");
            if (color) return color.trim();

            const style = stop.getAttribute("style");
            if (style) {
              const match = style.match(/stop-color:\s*([^;]+)/i);
              if (match) return match[1].trim();
            }

            return null;
          };

          const stopColors = stops
            .map((stop) => getStopColor(stop))
            .filter(Boolean);

          if (stopColors.length > 3) {
            const firstColor = stopColors[0]?.trim().toUpperCase();
            const lastColor =
              stopColors[stopColors.length - 1]?.trim().toUpperCase();

            // Symmetric gradient → special node
            if (firstColor && lastColor && firstColor === lastColor) {
              return true;
            }
          }
        }
      }
    }

    /* ---------- Mask checks ---------- */

    // Elements that use masks
    const elementsWithMask = svgElement.querySelectorAll("[mask]");
    if (elementsWithMask.length > 0) {
      return true;
    }

    // Mask elements themselves
    const svgNS = "http://www.w3.org/2000/svg";
    const maskElements = svgElement.getElementsByTagNameNS(svgNS, "mask");
    if (maskElements.length > 0) {
      return true;
    }

    /* ---------- Fill color complexity ---------- */

    const allElements = svgElement.querySelectorAll("*");
    const uniqueFillColors = new Set();

    for (const el of allElements) {
      const fill = el.getAttribute("fill");

      if (fill && fill !== "none" && !fill.startsWith("url(")) {
        const normalizedColor = fill.trim().toUpperCase();
        if (normalizedColor && normalizedColor !== "NONE") {
          uniqueFillColors.add(normalizedColor);
        }
      }
    }

    // Two or more distinct fill colors → complex design
    if (uniqueFillColors.size >= 2) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "Error analyzing SVG text for special handling:",
      error
    );
    return false;
  }
}

/**
 * Analyzes an SVG file to determine if it should preserve its original colors.
 *
 * @param {string} svgPath - Path to the SVG file
 * @returns {Promise<boolean>}
 */
async function analyzeSvgForSpecialHandling(svgPath) {
  if (svgAnalysisCache.has(svgPath)) {
    return svgAnalysisCache.get(svgPath);
  }

  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();

    const isSpecial = analyzeSvgTextForSpecialHandling(svgText);
    svgAnalysisCache.set(svgPath, isSpecial);

    return isSpecial;
  } catch (error) {
    console.error(
      "Error analyzing SVG for special handling:",
      error
    );

    svgAnalysisCache.set(svgPath, false);
    return false;
  }
}

/**
 * Checks if a node type requires special color handling.
 *
 * @param {string} nodeType - Node type (e.g., 'rectangular-tank-node')
 * @param {string|null} svgPath - Optional SVG path
 * @returns {Promise<boolean>}
 */
export async function isSpecialNode(nodeType, svgPath = null) {
  if (!nodeType || typeof nodeType !== "string") {
    return false;
  }

  if (svgPath) {
    return analyzeSvgForSpecialHandling(svgPath);
  }

  try {
    const { svgMap } = await import('../svgMap');
    const resolvedSvgPath = svgMap[nodeType];

    if (!resolvedSvgPath) {
      return false;
    }

    return analyzeSvgForSpecialHandling(resolvedSvgPath);
  } catch (error) {
    console.error(
      "Error resolving SVG path for node type:",
      nodeType,
      error
    );
    return false;
  }
}

/**
 * Synchronous version for SVG text.
 *
 * @param {string} svgText
 * @returns {boolean}
 */
export function isSpecialNodeFromSvgText(svgText) {
  if (!svgText || typeof svgText !== "string") {
    return false;
  }

  return analyzeSvgTextForSpecialHandling(svgText);
}

/**
 * Synchronous cache-based check.
 *
 * @param {string} nodeType
 * @param {string|null} svgPath
 * @returns {boolean}
 */
export function isSpecialNodeSync(nodeType, svgPath = null) {
  if (!nodeType || typeof nodeType !== "string") {
    return false;
  }

  if (svgPath && svgAnalysisCache.has(svgPath)) {
    return svgAnalysisCache.get(svgPath);
  }

  return false;
}

/**
 * Clears the SVG analysis cache.
 */
export function clearSvgAnalysisCache() {
  svgAnalysisCache.clear();
}
