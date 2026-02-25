/** Utility functions for identifying nodes that require special color handling.
 * SPECIAL NODE CRITERIA:
 * A node is considered "special" if it meets ONE of the following conditions:
 * 1. Has gradients AND additional fill colors beyond gradient colors - Example: SVG with gradient fills plus solid color elements
 * 2. Has 2+ distinct fill colors (without gradients) - Example: GearBox.svg has background (#F4F4F6) + gear shapes (#4D4D4D)
 * EXCLUSIONS:
 * - Elements with masks are excluded (decorative borders/outlines)
 * - Elements inside mask definitions are excluded
 * - Stroke colors are NOT considered (only fill colors)
 * - SVGs with only 1 distinct fill color are NOT special - Example: S&TExchangerV2.svg has multiple elements but all use #4D4D4D
 * This is determined dynamically by analyzing the SVG file itself,
 * using logic similar to extractColorsFromSvg, rather than using a hardcoded list.
 */
import { CompareValuesWithSymbol } from "../../../../utills/nodeNameUtils/nodeNameUtils";
// Cache for SVG analysis results to avoid re-analyzing the same SVG multiple times
const svgAnalysisCache = new Map();
/** Analyzes SVG content (text) to determine if it should preserve its original colors.
 * @param {string} svgText - The SVG content as text
 * @returns {boolean} - True if the SVG should preserve its original colors
 */

/* ---------- Helper Functions (Move these outside the main function) ---------- */
// 1. Logic to extract colors from a single gradient element
const getGradientColors = (gradient, getStopColor) => {
  const colors = new Set();
  const stops = gradient.querySelectorAll("stop");
  stops.forEach((stop) => {
    const color = getStopColor(stop);
    if (color) colors.add(color.trim().toUpperCase());
  });
  return colors;
};
// 2. Logic to determine if an element should be ignored
const shouldIgnoreElement = (el) => {
  const isSvgRoot = el.tagName === "svg";
  const isMaskRelated =
    CompareValuesWithSymbol("||", el.tagName === "mask", el.closest("mask")) ||
    el.hasAttribute("mask");
  const isNonVisual = [
    "defs",
    "style",
    "script",
    "title",
    "desc",
    "metadata",
  ].includes(el.tagName);
  return CompareValuesWithSymbol("||", isSvgRoot, isMaskRelated, isNonVisual);
};
// 3. Logic to validate and normalize a fill color
const getValidFillColor = (el) => {
  const fill = el.getAttribute("fill");
  if (!fill || fill === "none" || fill.startsWith("url(")) return null;
  const normalized = fill.trim().toUpperCase();
  return normalized !== "NONE" ? normalized : null;
};
/* ---------- Main Function ---------- */
function analyzeSvgTextForSpecialHandling(svgText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = doc.documentElement;
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
    const gradients = svgElement.querySelectorAll(
      "linearGradient, radialGradient",
    );
    const gradientColors = new Set();
    gradients.forEach((g) => {
      getGradientColors(g, getStopColor).forEach((c) => gradientColors.add(c));
    });
    const allElements = Array.from(svgElement.querySelectorAll("*"));
    if (gradients.length === 0) {
      // Case 1: No gradients - Check for 2+ distinct fill colors
      const allFillColors = new Set();
      for (const el of allElements) {
        // eslint-disable-next-line no-continue
        if (shouldIgnoreElement(el)) continue;
        const color = getValidFillColor(el);
        if (color) allFillColors.add(color);
      }
      return allFillColors.size >= 2;
    }
    // Case 2: Gradients exist - Check for additional non-gradient colors
    for (const el of allElements) {
      // eslint-disable-next-line no-continue
      if (shouldIgnoreElement(el)) continue;
      const color = getValidFillColor(el);
      if (CompareValuesWithSymbol("&&", color, !gradientColors.has(color)))
        return true;
    }
    return false;
  } catch (error) {
    console.error("Error analyzing SVG text for special handling:", error);
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
    console.error("Error analyzing SVG for special handling:", error);
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
    const { svgMap } = await import("../../components/svgMap/SvgMap");
    const resolvedSvgPath = svgMap[nodeType];
    if (!resolvedSvgPath) {
      return false;
    }
    return analyzeSvgForSpecialHandling(resolvedSvgPath);
  } catch (error) {
    console.error("Error resolving SVG path for node type:", nodeType, error);
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
