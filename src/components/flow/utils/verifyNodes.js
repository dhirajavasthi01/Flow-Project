/**
 * Utility to verify and list all dynamically generated nodes
 * This can be used for debugging and verification
 */

import { svgMap } from '../svgMap';
import { nodeTypes, allNodes, nodeTypesConfig } from '../NodeEdgeTypes';
import { toKebabCase, toCamelCase, toPascalCase, getDisplayName } from './nodeNameUtils';

/**
 * Verifies that all SVG files are properly converted to nodes
 * Returns a report of all detected nodes
 */
export function verifyAllNodes() {
  const svgFiles = Object.keys(import.meta.glob('../../assets/flowIcons/*.svg', { eager: true }));
  
  const report = {
    totalSvgFiles: svgFiles.length,
    nodesGenerated: [],
    missingNodes: [],
    errors: []
  };

  svgFiles.forEach(path => {
    const filename = path.split('/').pop();
    if (!filename) return;

    try {
      const kebabName = toKebabCase(filename);
      const camelName = toCamelCase(filename);
      const pascalName = toPascalCase(filename);
      const displayName = getDisplayName(filename);

      const nodeInfo = {
        filename,
        kebabName,
        camelName,
        pascalName,
        displayName,
        hasSvgInMap: !!svgMap[kebabName],
        hasNodeType: !!nodeTypes[camelName],
        hasNodeConfig: allNodes.some(node => node?.nodeType === kebabName),
        hasFieldConfig: !!nodeTypesConfig[kebabName],
      };

      // Check if all required parts are present
      const isComplete = nodeInfo.hasSvgInMap && 
                        nodeInfo.hasNodeType && 
                        nodeInfo.hasNodeConfig && 
                        nodeInfo.hasFieldConfig;

      if (isComplete) {
        report.nodesGenerated.push(nodeInfo);
      } else {
        report.missingNodes.push(nodeInfo);
      }
    } catch (error) {
      report.errors.push({
        filename,
        error: error.message
      });
    }
  });

  return report;
}

/**
 * Logs a verification report to the console
 */
export function logNodeVerification() {
  const report = verifyAllNodes();
  
  console.group('🔍 Node Generation Verification');
  console.log(`Total SVG Files: ${report.totalSvgFiles}`);
  console.log(`✅ Successfully Generated: ${report.nodesGenerated.length}`);
  console.log(`❌ Missing/Incomplete: ${report.missingNodes.length}`);
  console.log(`⚠️ Errors: ${report.errors.length}`);
  
  if (report.nodesGenerated.length > 0) {
    console.group('✅ Generated Nodes');
    report.nodesGenerated.forEach(node => {
      console.log(`  • ${node.displayName} (${node.filename})`);
      console.log(`    - Type: ${node.camelName}`);
      console.log(`    - NodeType: ${node.kebabName}`);
    });
    console.groupEnd();
  }
  
  if (report.missingNodes.length > 0) {
    console.group('❌ Missing/Incomplete Nodes');
    report.missingNodes.forEach(node => {
      console.warn(`  • ${node.displayName} (${node.filename})`);
      if (!node.hasSvgInMap) console.warn('    - Missing from svgMap');
      if (!node.hasNodeType) console.warn('    - Missing from nodeTypes');
      if (!node.hasNodeConfig) console.warn('    - Missing from allNodes');
      if (!node.hasFieldConfig) console.warn('    - Missing from nodeTypesConfig');
    });
    console.groupEnd();
  }
  
  if (report.errors.length > 0) {
    console.group('⚠️ Errors');
    report.errors.forEach(err => {
      console.error(`  • ${err.filename}: ${err.error}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return report;
}

