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
    setTemplateDropCounts((prev) => ({
      ...prev,
      [templateId]: newDropCount,
    }));

    const result = handleTemplateDrop(
      templateId,
      position,
      (newNodes) => {
        console.log(
          "Adding nodes:",
          newNodes.map((n) => ({ id: n.id, type: n.type }))
        );
        setNodes((prev) => [...prev, ...newNodes]);
      },
      (newEdges) => {
        console.log(
          "Adding edges:",
          newEdges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
          }))
        );
        setEdges((prev) => [...prev, ...newEdges]);
      },
      newDropCount
    );

    if (result.success) {
      console.log("Template dropped successfully:", result);
    } else {
      console.error("Failed to drop template:", result.error);
    }
    console.log("=== END DROP DEBUG ===");
  } catch (error) {
    console.error("Error parsing template data:", error);
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
 