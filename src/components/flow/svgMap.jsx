import { toKebabCase } from './utils/nodeNameUtils';

// Dynamically import all SVG files from the flowIcons folder
// Using import: 'default' to get the URL string directly from each SVG import
const svgModules = import.meta.glob('../../assets/flowIcons/*.svg', { 
  eager: true,
  import: 'default'
});

/**
 * Dynamically generates svgMap from all SVG files in assets/flowIcons
 * Converts filenames to kebab-case node types automatically
 */
export const svgMap = Object.keys(svgModules).reduce((acc, path) => {
  // Extract filename from path (e.g., "../../assets/flowIcons/Bearing.svg" -> "Bearing.svg")
  const filename = path.split('/').pop();
  
  // Skip if no filename
  if (!filename) return acc;
  
  // Convert filename to kebab-case node type
  const nodeType = toKebabCase(filename);
  
  // Get the SVG URL - with import: 'default', it should be a string directly
  // But handle both cases: direct string or module with default property
  const svgModule = svgModules[path];
  let svgUrl = null;
  
  if (svgModule) {
    // With import: 'default', it should be a string, but handle module objects too
    if (typeof svgModule === 'string') {
      svgUrl = svgModule;
    } else if (svgModule.default && typeof svgModule.default === 'string') {
      svgUrl = svgModule.default;
    } else if (typeof svgModule === 'object') {
      // Fallback: try to extract any string value
      const stringValue = Object.values(svgModule).find(v => typeof v === 'string');
      if (stringValue) {
        svgUrl = stringValue;
      }
    }
  }
  
  // Only add if we have a valid string URL
  if (svgUrl && typeof svgUrl === 'string') {
    acc[nodeType] = svgUrl;
  }
  
  return acc;
}, {});
