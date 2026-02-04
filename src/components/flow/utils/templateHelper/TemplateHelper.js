import { sortNodesByParentChild } from '../parentChildUtils/ParentChildUtils';

/**
 * Handles drag over event for templates
 * @param {Event} event - Drag event
 */
export const handleDragOver = (event) => {
  event.preventDefault();
  const hasTemplateType = Array.from(
    event.dataTransfer?.types || []
  ).includes("application/template");
  const plain =
    event.dataTransfer?.getData && event.dataTransfer.getData("text/plain");
  const isTemplateFallback = plain?.startsWith("TEMPLATE:");
  event.dataTransfer.dropEffect =
    hasTemplateType || isTemplateFallback ? "copy" : "move";
};

/**
 * Handles template drop event
 * @param {Object} params - Parameters object
 * @param {Event} params.event - Drop event
 * @param {Function} params.screenToFlowPosition - Function to convert screen position to flow position
 * @param {Function} params.handleTemplateDrop - Function to handle template drop
 * @param {Object} params.templateDropCounts - Template drop counts object
 * @param {Function} params.setTemplateDropCounts - Function to update template drop counts
 * @param {Function} params.setNodes - Function to update nodes
 * @param {Function} params.setEdges - Function to update edges
 * @param {Function} params.takeSnapshot - Function to take snapshot for undo
 * @returns {boolean} Returns true if template was handled, false otherwise
 */
export const handleTemplateDropHelper = ({
  event,
  screenToFlowPosition,
  handleTemplateDrop,
  templateDropCounts,
  setTemplateDropCounts,
  setNodes,
  setEdges,
  takeSnapshot,
}) => {
  // Extract template data from drag event
  let templateData = event.dataTransfer.getData("application/template");
  if (!templateData) {
    const fallback = event.dataTransfer.getData("text/plain");
    if (fallback?.startsWith("TEMPLATE:")) {
      templateData = JSON.stringify({
        templateId: fallback.replace("TEMPLATE:", ""),
      });
    }
  }

  // If no template data, return false to indicate it wasn't a template drop
  if (!templateData) {
    return false;
  }

  // Handle template drop
  event.preventDefault();
  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  try {
    const { templateId } = JSON.parse(templateData);
    const currentDropCount = templateDropCounts[templateId] || 0;
    const newDropCount = currentDropCount + 1;
    
    // Update drop count
    setTemplateDropCounts((prev) => ({
      ...prev,
      [templateId]: newDropCount,
    }));

    // Actually call handleTemplateDrop to add nodes and edges
    if (handleTemplateDrop) {
      // Take snapshot before adding template nodes for undo functionality
      if (takeSnapshot) {
        takeSnapshot();
      }
      
      handleTemplateDrop(
        templateId,
        position,
        (nodes) => {
          // Add nodes to the flow
          setNodes((prevNodes) => {
            // Ensure parent-child ordering when adding template nodes
            const updatedNodes = [...prevNodes, ...nodes];
            return sortNodesByParentChild(updatedNodes);
          });
        },
        (edges) => {
          // Add edges to the flow
          setEdges((prevEdges) => [...prevEdges, ...edges]);
        },
        currentDropCount
      );
    }
  } catch (error) {
    console.error("Error parsing template data:", error);
    return false;
  }

  return true;
};

/**
 * Handles saving selected nodes and edges as a template
 * @param {Object} params - Parameters object
 * @param {Array} params.selNodes - Selected nodes array
 * @param {Array} params.selEdges - Selected edges array
 * @param {Function} params.saveTemplate - Function to save template
 * @param {Function} params.setShowSaveTemplate - Function to update show save template state
 */
export const handleSaveTemplate = ({
  selNodes,
  selEdges,
  saveTemplate,
  setShowSaveTemplate,
}) => {
  if (selNodes.length === 0) {
    alert("Please select at least one node to save as template");
    return;
  }

  const name = prompt("Enter template name:", `Template ${Date.now()}`);
  if (!name?.trim()) {
    return;
  }

  try {
    saveTemplate(name.trim(), selNodes, selEdges);
    setShowSaveTemplate(false);
    alert(
      `Template "${name}" saved successfully with ${selNodes.length} node${selNodes.length !== 1 ? "s" : ""} and ${selEdges.length} edge${selEdges.length !== 1 ? "s" : ""}!`
    );
  } catch (error) {
    alert(`Error saving template: ${error.message}`);
  }
};
 