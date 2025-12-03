/**
 * Utility functions for converting SVG filenames to various naming conventions
 */

/**
 * Converts a filename to PascalCase
 * Example: "bearing.svg" -> "Bearing", "centrifugal-pump.svg" -> "CentrifugalPump"
 */
export function toPascalCase(filename) {
  // Remove .svg extension
  const name = filename.replace(/\.svg$/i, '');
  
  // Split by common separators and convert to PascalCase
  return name
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Converts a filename to kebab-case
 * Example: "Bearing.svg" -> "bearing-node", "CentrifugalPump.svg" -> "centrifugal-pump-node"
 */
export function toKebabCase(filename) {
  // Remove .svg extension
  const name = filename.replace(/\.svg$/i, '');
  
  // Convert camelCase/PascalCase to kebab-case
  // Split by uppercase letters, keeping the uppercase letters with their following lowercase letters
  const words = [];
  let currentWord = '';
  
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    const isUpper = /[A-Z]/.test(char);
    const prevChar = i > 0 ? name[i - 1] : '';
    const isPrevLower = /[a-z]/.test(prevChar);
    
    if (isUpper && isPrevLower && currentWord) {
      // Start a new word when we hit an uppercase after lowercase
      words.push(currentWord);
      currentWord = char;
    } else {
      currentWord += char;
    }
  }
  
  if (currentWord) {
    words.push(currentWord);
  }
  
  // Join words with dashes and convert to lowercase
  const kebab = words.join('-').toLowerCase();
  
  return `${kebab}-node`;
}

/**
 * Converts a filename to camelCase for node type keys
 * Example: "Bearing.svg" -> "bearingNode", "CentrifugalPump.svg" -> "centrifugalPumpNode"
 */
export function toCamelCase(filename) {
  // Remove .svg extension
  const name = filename.replace(/\.svg$/i, '');
  
  // Convert to camelCase
  const pascal = toPascalCase(filename);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1) + 'Node';
}

/**
 * Gets the display name for a node
 * Example: "Bearing.svg" -> "Bearing Node"
 */
export function getDisplayName(filename) {
  const pascal = toPascalCase(filename);
  return `${pascal} Node`;
}

