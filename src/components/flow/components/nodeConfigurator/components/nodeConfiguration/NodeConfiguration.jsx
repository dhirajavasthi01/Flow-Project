import React from "react";

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
const NodeConfiguration = ({
  config,
  fieldsToRender,
  data,
  getInputField,
  renderSubSystemSelect,
  setShouldUpdateConfig,
  setSelectedNodeId,
  setDelete,
  onConfigChange,
  subComponentList,
}) => {
  return (
    <div className="h-100">
      <div className="flex justify-between items-center bg-primary_blue_bg p-[1.5vmin] border-b-[0.025vmin] border-b-primary_gray_3">
        <h3 className="text-14 text-primary_dark_blue uppercase font-sabic_text_bold">
          Configure Node
        </h3>
      </div>

      <div className="p-[1vmin_1.5vmin]">
        <p className="text-14 text-primary_gray font-sabic_text_bold uppercase mb-1">
          Node id :{" "}
          <span className="text-14 font-sabic_text_regular text-primary_gray_1">
            {config.id}
          </span>
        </p>
        <p className="text-14 text-primary_gray font-sabic_text_bold uppercase ">
          Node Name :{" "}
          <span className="text-14 font-sabic_text_regular text-primary_gray_1">
            {config.name}
          </span>
        </p>
      </div>
      <>
        {fieldsToRender.map((field) => getInputField(field, data))}

        {renderSubSystemSelect(data, subComponentList, onConfigChange)}

        <div className="flex justify-around items-center mt-[1vmin] flex-wrap gap-[1vmin]">
          <button
            className={`
                                 bg-primary_blue hover:bg-primary_blue_hover
                                  text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase
                                  `}
            onClick={() => {
              setShouldUpdateConfig(true);
            }}
          >
            Apply
          </button>
          <button
            className={` bg-primary_black hover:bg-primary_gray
                                  text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}
            onClick={() => {
              setSelectedNodeId(null);
            }}
          >
            Close
          </button>
          <button
            className={` bg-primary_orange hover:bg-primary_red_60
                                  text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}
            onClick={() => {
              setDelete(true);
            }}
          >
            Delete
          </button>
        </div>

        <div className="text-14 text_primary_gray_3 uppercase p-[1.5vmin_1.5vmin]">
          <b className="">Note : </b> All changes to the node will only be
          applied upon clicking Apply button
        </div>
      </>
    </div>
  );
};

export default NodeConfiguration;
