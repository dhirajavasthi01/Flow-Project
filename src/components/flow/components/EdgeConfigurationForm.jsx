import React from 'react';
import { edgeOptions } from '../../../utills/flowUtills/FlowUtills';

/**
 * EdgeConfigurationForm Component
 * Renders the form for configuring a selected edge
 * 
 * @param {Object} props
 * @param {Object} props.config - The edge configuration object
 * @param {Object} props.data - The edge data object
 * @param {Function} props.onEdgeConfigChange - Function to handle edge type changes
 * @param {Function} props.setConfig - Function to update the config atom
 * @param {Function} props.setShouldUpdateConfig - Function to trigger config update
 * @param {Function} props.setSelectedEdgeId - Function to clear selected edge
 * @param {Function} props.setDelete - Function to trigger edge deletion
 */
const EdgeConfigurationForm = ({
  config,
  data,
  onEdgeConfigChange,
  setConfig,
  setShouldUpdateConfig,
  setSelectedEdgeId,
  setDelete,
}) => {
  return (
    <div className="h-100">
      <h3 className="text-14-bold mb-1">Configure Edge</h3>
      <p className="text-18">
        Edge id :
        <span className="text_primary_gray_2">{config.id}</span>
      </p>
      <div>
        <label className="text-13-bold uppercase">Edge Type :</label>
        <select
          className="form-select"
          name="type"
          value={data?.type || ""}
          onChange={onEdgeConfigChange}
          style={{
            fontSize: "1.4vmin",
            width: "100%",
            borderRadius: ".3vmin",
            border: "none",
          }}
        >
          {edgeOptions.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </select>
      </div>
      <div className="text-14 p-[1vmin_1.5vmin]">
        <label className="text-15 text-primary_dark_blue uppercase">
          Edge Color :
        </label>
        <input
          type="color"
          name="strokeColor"
          value={config?.style?.stroke || "#000000"}
          onChange={(e) => {
            const color = e.target.value;
            setConfig((prev) => ({
              ...prev,
              style: {
                ...prev.style,
                stroke: color,
              },
              // Update markerEnd color if it exists
              markerEnd: prev.markerEnd
                ? { ...prev.markerEnd, color }
                : prev.markerEnd,
            }));
          }}
          className="form-control text-16"
          style={{ width: "100%", marginTop: "0.5vmin" }}
        />
      </div>
      <div className="text-14 p-[1vmin_1.5vmin]">
        <label className="text-15 text-primary_dark_blue uppercase">
          Edge Width :
        </label>
        <input
          type="number"
          name="strokeWidth"
          min="1"
          max="20"
          step="1"
          value={config?.style?.strokeWidth || 5}
          onChange={(e) => {
            const width = parseInt(e.target.value) || 5;
            setConfig((prev) => ({
              ...prev,
              style: {
                ...prev.style,
                strokeWidth: width,
              },
            }));
          }}
          className="form-control text-14-regular"
          style={{ width: "100%", marginTop: "0.5vmin", fontSize: "1.4vmin", padding: "0.5vmin" }}
        />
      </div>
      {config?.markerEnd && (
        <div className="text-14 p-[1vmin_1.5vmin]">
          <label className="text-15 text-primary_dark_blue uppercase">
            Arrow Size :
          </label>
          <input
            type="number"
            name="arrowSize"
            min="5"
            max="50"
            step="1"
            value={config?.markerEnd?.width || 20}
            onChange={(e) => {
              const size = parseInt(e.target.value) || 20;
              setConfig((prev) => ({
                ...prev,
                markerEnd: prev.markerEnd
                  ? { ...prev.markerEnd, width: size, height: size }
                  : { type: 'arrowclosed', width: size, height: size, color: prev.style?.stroke || '#000' }
              }));
            }}
            className="form-control text-14-regular"
            style={{ width: "100%", marginTop: "0.5vmin", fontSize: "1.4vmin", padding: "0.5vmin" }}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        <button
          className="text-14-regular uppercase"
          onClick={() => setShouldUpdateConfig(true)}
        >
          Apply
        </button>
        <button
          className="text-14-regular uppercase"
          onClick={() => setSelectedEdgeId(null)}
        >
          Close
        </button>
        <button
          className="text-14-regular uppercase"
          onClick={() => setDelete(true)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default EdgeConfigurationForm;
