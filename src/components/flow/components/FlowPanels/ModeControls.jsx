import { Panel } from "@xyflow/react";

/**
 * ModeControls Component
 * Renders mode controls (partial selection, handles, save buttons)
 */
const ModeControls = ({
  showDeveloperMode,
  isDeveloperMode,
  partial,
  setPartial,
  show,
  toggle,
  handleSaveClick,
  isAdding,
  showSaveTemplate,
  handleSaveTemplate,
  selNodes = [],
  selEdges = [],
}) => {
  if (!showDeveloperMode || !isDeveloperMode) {
    return null;
  }

  return (
    <>
      <Panel position="top-left" className="lasso-controls">
        <label className="text-20">
          <input
            type="checkbox"
            checked={partial}
            onChange={() => setPartial((p) => !p)}
            className="xy-theme__checkbox mr-[0.5vmin]"
          />
          <span className="text-20 font-sabic_text_bold pt-[0.5vmin]">
            Partial selection
          </span>
        </label>
      </Panel>
      <Panel
        position="top-right"
        className="p-0 flex flex-col items-end gap-2"
      >
        <div className="flex gap-2">
          <button
            id="handles-button"
            data-testid="handles-button"
            onClick={() => toggle(!show)}
            className="w-fit flex justify-center items-center cursor-pointer uppercase text-14 font-medium bg-primary_blue text-white rounded-[0.3vmin] h-full px-[1.5vmin] py-[1vmin] hover:bg-primary_blue_hover transition"
          >
            {show ? "Hide Handles" : "Show Handles"}
          </button>
          <button
            id="save-button"
            data-testid="save-button"
            onClick={handleSaveClick}
            className="w-fit flex justify-center items-center cursor-pointer uppercase text-14 font-medium bg-primary_blue text-white rounded-[0.3vmin] h-full px-[1.5vmin] py-[1vmin] hover:bg-primary_blue_hover transition"
          >
            {isAdding ? "Saving..." : "Save"}
          </button>
        </div>
        {showSaveTemplate && (
          <button
            id="save-template-button"
            data-testid="save-template-button"
            onClick={handleSaveTemplate}
            className="text-[1.4vmin] font-medium uppercase text-white bg-green-600 hover:bg-green-700 transition rounded-[0.3vmin] px-[1.5vmin] py-[0.4vmin]"
          >
            Save as Template ({selNodes.length} node
            {selNodes.length !== 1 ? "s" : ""}, {selEdges.length}{" "}
            edge{selEdges.length !== 1 ? "s" : ""})
          </button>
        )}
      </Panel>
    </>
  );
};

export default ModeControls;
