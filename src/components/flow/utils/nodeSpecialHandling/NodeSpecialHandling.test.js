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
  stops.forEach(stop => {
    const color = getStopColor(stop);
    if (color) colors.add(color.trim().toUpperCase());
  });
  return colors;
};
// 2. Logic to determine if an element should be ignored
const shouldIgnoreElement = (el) => {
  const isSvgRoot = el.tagName === "svg";
  const isMaskRelated = CompareValuesWithSymbol('||', el.tagName === "mask", el.closest("mask")) || el.hasAttribute("mask");
  const isNonVisual = ["defs", "style", "script", "title", "desc", "metadata"].includes(el.tagName);
  return CompareValuesWithSymbol('||', isSvgRoot, isMaskRelated, isNonVisual);
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
    const gradients = svgElement.querySelectorAll("linearGradient, radialGradient");
    const gradientColors = new Set();
    gradients.forEach(g => {
      getGradientColors(g, getStopColor).forEach(c => gradientColors.add(c));
    });
    const allElements = Array.from(svgElement.querySelectorAll("*"));
    if (gradients.length === 0) { // Case 1: No gradients - Check for 2+ distinct fill colors
      const allFillColors = new Set();
      for (const el of allElements) {
        if (shouldIgnoreElement(el)) continue;
        const color = getValidFillColor(el);
        if (color) allFillColors.add(color);
      }
      return allFillColors.size >= 2;
    }
    // Case 2: Gradients exist - Check for additional non-gradient colors
    for (const el of allElements) {
      if (shouldIgnoreElement(el)) continue;
      const color = getValidFillColor(el);
      if (CompareValuesWithSymbol('&&', color, !gradientColors.has(color))) return true;
    }
    return false;
  } catch (error) {
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
    const { svgMap } = await import("../../components/svgMap/SvgMap")
    const resolvedSvgPath = svgMap[nodeType];
    if (!resolvedSvgPath) {
      return false;
    }
    return analyzeSvgForSpecialHandling(resolvedSvgPath);
  } catch (error) {
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
 import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  isSpecialNode,
  isSpecialNodeFromSvgText,
  isSpecialNodeSync,
  clearSvgAnalysisCache,
} from "./NodeSpecialHandling";

/* ------------------ MOCKS ------------------ */

// Mock CompareValuesWithSymbol utility
vi.mock("../../../../utills", () => ({
  CompareValuesWithSymbol: (op, ...args) => {
    if (op === "||") return args.some(Boolean);
    if (op === "&&") return args.every(Boolean);
    return false;
  },
}));

// Mock svgMap dynamic import
vi.mock("../../components/svgMap/SvgMap", () => ({
  svgMap: {
    "tank-node": "/tank.svg",
    "gear-node": "/gear.svg",
  },
}));

/* ------------------ HELPERS ------------------ */

const svgSingleColor = `
<svg>
  <rect fill="#000000" />
  <circle fill="#000000" />
</svg>
`;

const svgMultiColor = `
<svg>
  <rect fill="#000000" />
  <circle fill="#FFFFFF" />
</svg>
`;

const svgGradientOnly = `
<svg>
  <defs>
    <linearGradient id="g1">
      <stop stop-color="#000000" />
      <stop stop-color="#FFFFFF" />
    </linearGradient>
  </defs>
  <rect fill="url(#g1)" />
</svg>
`;

const svgGradientPlusExtraFill = `
<svg>
  <defs>
    <linearGradient id="g1">
      <stop stop-color="#000000" />
      <stop stop-color="#FFFFFF" />
    </linearGradient>
  </defs>
  <rect fill="url(#g1)" />
  <circle fill="#FF0000" />
</svg>
`;

const svgWithMaskIgnored = `
<svg>
  <defs>
    <mask id="m1">
      <rect fill="#000000"/>
    </mask>
  </defs>
  <rect mask="url(#m1)" fill="#FFFFFF" />
</svg>
`;

/* ------------------ TESTS ------------------ */

describe("NodeSpecialHandling", () => {
  beforeEach(() => {
    clearSvgAnalysisCache();
    vi.restoreAllMocks();
  });

  describe("isSpecialNodeFromSvgText (sync)", () => {
    it("returns false for invalid input", () => {
      expect(isSpecialNodeFromSvgText(null)).toBe(false);
      expect(isSpecialNodeFromSvgText(123)).toBe(false);
    });

    it("returns false for single fill color SVG", () => {
      expect(isSpecialNodeFromSvgText(svgSingleColor)).toBe(false);
    });

    it("returns true for multiple fill colors without gradients", () => {
      expect(isSpecialNodeFromSvgText(svgMultiColor)).toBe(true);
    });

    it("returns false for gradient-only SVG", () => {
      expect(isSpecialNodeFromSvgText(svgGradientOnly)).toBe(false);
    });

    it("returns true for gradient + extra non-gradient fill", () => {
      expect(isSpecialNodeFromSvgText(svgGradientPlusExtraFill)).toBe(true);
    });

    it("ignores masked elements", () => {
      expect(isSpecialNodeFromSvgText(svgWithMaskIgnored)).toBe(false);
    });
  });

  describe("isSpecialNode (async)", () => {
    it("returns false for invalid nodeType", async () => {
      expect(await isSpecialNode(null)).toBe(false);
      expect(await isSpecialNode(123)).toBe(false);
    });

    it("returns false if svgPath cannot be resolved", async () => {
      const result = await isSpecialNode("unknown-node");
      expect(result).toBe(false);
    });

    it("analyzes SVG via svgMap resolution", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve(svgMultiColor),
      });

      const result = await isSpecialNode("tank-node");
      expect(result).toBe(true);
    });

    it("uses cache on repeated calls", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        text: () => Promise.resolve(svgMultiColor),
      });
      global.fetch = fetchSpy;

      await isSpecialNode("tank-node");
      await isSpecialNode("tank-node");

      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it("returns false when fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

      const result = await isSpecialNode("tank-node");
      expect(result).toBe(false);
    });
  });

  describe("isSpecialNodeSync", () => {
    it("returns false for invalid nodeType", () => {
      expect(isSpecialNodeSync(null)).toBe(false);
    });

    it("returns false if cache is empty", () => {
      expect(isSpecialNodeSync("tank-node", "/tank.svg")).toBe(false);
    });

    it("returns cached value when available", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve(svgMultiColor),
      });

      await isSpecialNode("tank-node", "/tank.svg");

      expect(isSpecialNodeSync("tank-node", "/tank.svg")).toBe(true);
    });
  });

  describe("cache handling", () => {
    it("clears cache correctly", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        text: () => Promise.resolve(svgMultiColor),
      });

      await isSpecialNode("tank-node", "/tank.svg");
      clearSvgAnalysisCache();

      expect(isSpecialNodeSync("tank-node", "/tank.svg")).toBe(false);
    });
  });

  describe("error handling in SVG parsing", () => {
    it("returns false on malformed SVG", () => {
      const badSvg = "<svg><unclosed>";
      expect(isSpecialNodeFromSvgText(badSvg)).toBe(false);
    });
  });
});

 