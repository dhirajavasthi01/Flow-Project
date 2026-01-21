import React from 'react';

/**
 * NodeConfigurationForm Component
 * Renders the form for configuring a selected node
 * 
 * @param {Object} props
 * @param {Object} props.config - The node configuration object
 * @param {Array} props.fieldsToRender - Array of field configurations to render
 * @param {Object} props.data - The node data object
 * @param {Function} props.getInputField - Function to render input fields
 * @param {Function} props.renderSubSystemSelect - Function to render subsystem select
 * @param {Function} props.setShouldUpdateConfig - Function to trigger config update
 * @param {Function} props.setSelectedNodeId - Function to clear selected node
 * @param {Function} props.setDelete - Function to trigger node deletion
 */
const NodeConfigurationForm = ({
  config,
  fieldsToRender,
  data,
  getInputField,
  renderSubSystemSelect,
  setShouldUpdateConfig,
  setSelectedNodeId,
  setDelete,
}) => {
  return (
    <div className="h-100">
      <div className="flex justify-between items-center bg-primary_blue_bg p-[1vmin_1.5vmin]">
        <h3 className="text-16 font-bold text-primary_dark_blue uppercase">
          Configure Node
        </h3>
      </div>
      <div className="p-[1vmin_1.5vmin]">
        <p className="text-18 text-primary_dark_blue uppercase mb-1">
          Node id :
          <span className="text-13-bold text-primary_gray">{config.id}</span>
        </p>
        <p className="text-18 text-primary_dark_blue uppercase">
          Node Name :
          <span className="text-13-bold text-primary_gray">
            {config.name}
          </span>
        </p>
      </div>
      <>
        {fieldsToRender.map((field) => getInputField(field, data))}
        {renderSubSystemSelect(data)}
        <div className="flex justify-around items-center mt-[1vmin] flex-wrap gap-[1vmin]">
          <button
            className="bg-primary_blue text-white text-15 rounded-[0.3vmin] p-[0.9vmin_2vmin] uppercase"
            onClick={() => setShouldUpdateConfig(true)}
          >
            Apply
          </button>
          <button
            className="bg-primary_blue text-white text-15 rounded-[0.3vmin] p-[0.9vmin_2vmin] uppercase"
            onClick={() => setSelectedNodeId(null)}
          >
            Close
          </button>
          <button
            className="bg-primary_blue text-white text-15 rounded-[0.3vmin] p-[0.9vmin_2vmin] uppercase"
            onClick={() => setDelete(true)}
          >
            Delete
          </button>
        </div>
        <div className="text-16 text-primary_gray_2 uppercase p-[1vmin_1.5vmin]">
          <b>Note :</b> All changes will only be applied after clicking the
          Apply button.
        </div>
      </>
    </div>
  );
};

export default NodeConfigurationForm;
