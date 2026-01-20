import ModeControls from "./ModeControls";
import LegendPanel from "./LegendPanel";

/**
 * FlowPanels Component
 * Renders all the panels for the Flow component including developer mode controls and legend
 * @param {Object} props - Component props
 * @param {boolean} [props.isFullView=false] - Whether the flow is in full view mode
 * @param {boolean} [props.showDeveloperMode=false] - Whether to show developer mode controls
 * @param {boolean} [props.isDeveloperMode=false] - Whether developer mode is active
 * @param {boolean} [props.partial=false] - Partial selection state
 * @param {Function} [props.setPartial] - Function to set partial selection state
 * @param {boolean} [props.show=false] - Show handles state
 * @param {Function} [props.toggle] - Function to toggle handles visibility
 * @param {Function} [props.handleSaveClick] - Handler for save button click
 * @param {boolean} [props.isAdding=false] - Whether save operation is in progress
 * @param {boolean} [props.showSaveTemplate=false] - Whether to show save template button
 * @param {Function} [props.handleSaveTemplate] - Handler for save template button click
 * @param {Array} [props.selNodes=[]] - Selected nodes array
 * @param {Array} [props.selEdges=[]] - Selected edges array
 * @param {string} [props.legendPosition] - Position of the legend panel
 * @param {boolean} [props.showDrawer=false] - Whether drawer is shown
 * @param {Function} [props.setShowDrawer] - Function to set drawer visibility
 */
const FlowPanels = (props = {}) => {
  // Destructure with default values to handle null/undefined
  const {
    isFullView = false,
    showDeveloperMode = false,
    isDeveloperMode = false,
    partial = false,
    setPartial,
    show = false,
    toggle,
    handleSaveClick,
    isAdding = false,
    showSaveTemplate = false,
    handleSaveTemplate,
    selNodes = [],
    selEdges = [],
    legendPosition = "bottom-right",
    showDrawer = false,
    setShowDrawer,
  } = props || {};

  return (
    <>
      {!isFullView && (
        <ModeControls
          showDeveloperMode={showDeveloperMode}
          isDeveloperMode={isDeveloperMode}
          partial={partial}
          setPartial={setPartial}
          show={show}
          toggle={toggle}
          handleSaveClick={handleSaveClick}
          isAdding={isAdding}
          showSaveTemplate={showSaveTemplate}
          handleSaveTemplate={handleSaveTemplate}
          selNodes={selNodes}
          selEdges={selEdges}
        />
      )}
      <LegendPanel
        legendPosition={legendPosition}
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
      />
    </>
  );
};

export default FlowPanels;
