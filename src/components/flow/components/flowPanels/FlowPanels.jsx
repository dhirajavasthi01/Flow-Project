import LegendPanel from './components/legendPanel/LegendPanel'
import ModeControls from './components/ModeControls/ModeControls'

// Renders all the panels for the Flow component including developer mode controls and legend
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
    legendPosition = 'bottom-right',
    showDrawer = false,
    setShowDrawer,
    selectedNodeId,
    getNodes,
    setNodes,
    nodes,
    handleDeleteAll,
  } = props || {}

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
          selectedNodeId={selectedNodeId}
          getNodes={getNodes}
          setNodes={setNodes}
          nodes={nodes}
          handleDeleteAll={handleDeleteAll}
        />
      )}
      <LegendPanel
        legendPosition={legendPosition}
        showDrawer={showDrawer}
        setShowDrawer={setShowDrawer}
      />
    </>
  )
}

export default FlowPanels
