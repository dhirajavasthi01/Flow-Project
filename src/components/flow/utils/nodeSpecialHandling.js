/**
 * Utility functions for identifying nodes that require special color handling.
 * 
 * SPECIAL NODE CRITERIA:
 * A node is considered "special" if it meets ONE of the following conditions:
 * 
 * 1. Has gradients AND additional fill colors beyond gradient colors
 *    - Example: SVG with gradient fills plus solid color elements
 * 
 * 2. Has 2+ distinct fill colors (without gradients)
 *    - Example: GearBox.svg has background (#F4F4F6) + gear shapes (#4D4D4D)
 * 
 * EXCLUSIONS:
 * - Elements with masks are excluded (decorative borders/outlines)
 * - Elements inside mask definitions are excluded
 * - Stroke colors are NOT considered (only fill colors)
 * - SVGs with only 1 distinct fill color are NOT special
 *    - Example: S&TExchangerV2.svg has multiple elements but all use #4D4D4D
 * 
 * This is determined dynamically by analyzing the SVG file itself,
 * using logic similar to extractColorsFromSvg, rather than using a hardcoded list.
 */

// Cache for SVG analysis results to avoid re-analyzing the same SVG multiple times
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

    /* ---------- Collect gradient colors ---------- */

    const gradients = svgElement.querySelectorAll(
      "linearGradient, radialGradient"
    );

    const gradientColors = new Set();
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

    // Collect all unique colors from all gradient stops
    for (const gradient of gradients) {
      const stops = Array.from(gradient.querySelectorAll("stop"));
      for (const stop of stops) {
        const color = getStopColor(stop);
        if (color) {
          gradientColors.add(color.trim().toUpperCase());
        }
      }
    }

    // If no gradients exist, check for multiple distinct fill colors
    if (gradients.length === 0) {
      const svgNS = "http://www.w3.org/2000/svg";
      const allElements = svgElement.querySelectorAll("*");
      const allFillColors = new Set();
      
      for (const el of allElements) {
        // Skip the root SVG element
        if (el.tagName === "svg") {
          continue;
        }
        
        // Skip mask elements and their children (masks use fill="white" for masking, not actual colors)
        if (el.tagName === "mask" || el.closest("mask")) {
          continue;
        }
        
        // Skip elements that use masks (often decorative borders/outlines, not main fill colors)
        if (el.hasAttribute("mask")) {
          continue;
        }
        
        // Skip defs, style, and other non-visual elements
        if (["defs", "style", "script", "title", "desc", "metadata"].includes(el.tagName)) {
          continue;
        }
        
        // Check fill colors only (excluding gradient references)
        const fill = el.getAttribute("fill");
        if (fill && fill !== "none" && !fill.startsWith("url(")) {
          const normalizedColor = fill.trim().toUpperCase();
          if (normalizedColor && normalizedColor !== "NONE") {
            allFillColors.add(normalizedColor);
          }
        }
      }
      
      // If there are 2+ distinct fill colors, it's special
      // This catches cases like GearBox.svg (background + gear shapes with different colors)
      // But excludes cases like S&TExchangerV2.svg (all elements use same color)
      if (allFillColors.size >= 2) {
        return true;
      }
      
      return false;
    }

    /* ---------- Collect all non-gradient fill colors ---------- */

    const svgNS = "http://www.w3.org/2000/svg";
    const allElements = svgElement.querySelectorAll("*");
    const nonGradientColors = new Set();

    for (const el of allElements) {
      // Skip the root SVG element
      if (el.tagName === "svg") {
        continue;
      }
      
      // Skip mask elements and their children (masks use fill="white" for masking, not actual colors)
      if (el.tagName === "mask" || el.closest("mask")) {
        continue;
      }
      
      // Skip elements that use masks (often decorative borders/outlines, not main fill colors)
      if (el.hasAttribute("mask")) {
        continue;
      }
      
      // Skip defs, style, and other non-visual elements
      if (["defs", "style", "script", "title", "desc", "metadata"].includes(el.tagName)) {
        continue;
      }
      
      // Check fill colors only (excluding gradient references)
      const fill = el.getAttribute("fill");
      if (fill && fill !== "none" && !fill.startsWith("url(")) {
        const normalizedColor = fill.trim().toUpperCase();
        if (normalizedColor && normalizedColor !== "NONE") {
          nonGradientColors.add(normalizedColor);
        }
      }
    }

    /* ---------- Check if there are additional colors beyond gradients ---------- */

    // A node is special only if it has gradients AND additional colors
    // that are different from the gradient colors
    for (const color of nonGradientColors) {
      if (!gradientColors.has(color)) {
        // Found a color that's not in the gradients → special node
        return true;
      }
    }

    // No additional colors beyond gradients → not special
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
