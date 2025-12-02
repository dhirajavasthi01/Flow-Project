import { useEffect, useState } from "react";
import Select from "react-select";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import MultiSelectV2 from "../multiSelect/MultiSelect";

import {
  allTagsDataAtom,
  deleteAtom,
  nodeConfigAtom,
  selectedEdgeIdAtom,
  selectedNodeIdAtom,
  selectedPageAtom,
  updateConfigAtom,
  subComponentListAtom,
} from "../../features/individualDetailWrapper/store/OverviewStore";

import { nodeTypesConfig } from "./NodeEdgeTypes";
import {
  edgeOptions,
  extractColorsFromSvg,
  text_box_resources,
  normalizeSubComponentAssetIds,
} from "../../utills/flowUtills/FlowUtills";

const switchStyles = {
  display: "flex",
  alignItems: "center",
};

const switchContainerStyles = {
  position: "relative",
  width: "40px",
  height: "20px",
  borderRadius: "20px",
  transition: "background-color 0.3s ease",
};

const switchKnobStyles = {
  position: "absolute",
  top: "50%",
  width: "14px",
  height: "14px",
  backgroundColor: "white",
  borderRadius: "50%",
  transition: "left 0.3s ease-in-out",
  transform: "translateY(-50%)",
};

const inputStyles = {
  opacity: 0,
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  cursor: "pointer",
  zIndex: 1,
};

const NodeConfigurator = () => {
  const [config, setConfig] = useAtom(nodeConfigAtom);
  const setShouldUpdateConfig = useSetAtom(updateConfigAtom);
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom);
  const setDelete = useSetAtom(deleteAtom);

  const selectedPage = useAtomValue(selectedPageAtom);
  const allTagsDataList = useAtomValue(allTagsDataAtom);
  const subComponentList = useAtomValue(subComponentListAtom);

  const [extractedColors, setExtractedColors] = useState(null);

  useEffect(() => {
    setConfig(null);
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
  }, [selectedPage, setConfig, setSelectedEdgeId, setSelectedNodeId]);

  useEffect(() => {
    if (config?.data?.svgPath) {
      extractColorsFromSvg(config.data.svgPath).then((colors) => {
        setExtractedColors(colors);
      });
    }
  }, [config?.data?.svgPath]);

  const handleColorChange = (e, counterpartName, counterpartValue) => {
    onConfigChange(e);
    const syntheticEvent = {
      target: {
        name: counterpartName,
        value: counterpartValue,
        type: "color",
        checked: false,
      },
    };
    onConfigChange(syntheticEvent);
  };

  const onConfigChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === "multi-select") {
      setConfig((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: value },
      }));
      return;
    }

    if (name === "template") {
      const selectedData = text_box_resources.find((x) => x.id === value);
      setConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          [name]: value,
          backgroundColor: selectedData.bgColor,
          borderColor: selectedData.borderColor,
        },
      }));
      return;
    }

    if (type === "checkbox") {
      setConfig((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: checked },
      }));
      return;
    }

    setConfig((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [name]:
          ["numSourceHandles", "numTargetHandles", "numSourceHandlesRight", "numTargetHandlesTop", "numSourceHandlesBottom", "numTargetHandlesLeft"].includes(name)
            ? parseInt(value)
            : value,
      },
    }));
  };

  const onEdgeConfigChange = (event) => {
    const { name, value } = event.target;
    setConfig((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      
      // If changing edge type, update markerEnd accordingly
      if (name === 'type') {
        const hasArrow = value === 'flowingPipeStraightArrow' || value === 'flowingPipeDottedArrow';
        if (hasArrow) {
          // Preserve existing arrow size if it exists, otherwise use default
          const existingSize = prev.markerEnd?.width || 20;
          updated.markerEnd = { 
            type: 'arrowclosed', 
            width: existingSize, 
            height: existingSize, 
            color: prev.style?.stroke || prev.markerEnd?.color || '#000' 
          };
        } else {
          updated.markerEnd = undefined;
        }
      }
      
      return updated;
    });
  };

  const getOptionsList = (key) => {
    if (key === "subSystem") {
      return [
        { id: null, name: "Select Sub System" },
        ...subComponentList.map((x) => ({ id: x.entityID, name: x.entityName })),
      ];
    }
    return [];
  };

  const getData = (selectedEdgeId, config) =>
    selectedEdgeId ? config : config?.data;

  const getInputField = (field, data) => {
    if (field.type === "number") {
      return (
        <div key={field.name} className="mb-2">
          <label className="text-13-bold uppercase">{field.label} :</label>
          <input
            className="form-control text-14-regular"
            type="number"
            name={field.name}
            value={data?.[field.name] || ""}
            min={field.min}
            onChange={onConfigChange}
          />
        </div>
      );
    }

    if (field.type === "text") {
      return (
        <div
          key={field.name}
          className="flex flex-nowrap p-[0.5vmin_1.5vmin] items-center"
        >
          <label className="text-16 text-primary_dark_blue uppercase whitespace-nowrap">
            {field.label} :
          </label>
          <input
            className="text-16 p-[0.5vmin] flex-grow ml-[0.5vmin] border border-primary_gray_2 rounded-[.4vmin] focus:outline-primary_blue"
            type="text"
            name={field.name}
            value={data?.[field.name] || ""}
            onChange={onConfigChange}
          />
        </div>
      );
    }

    if (field.type === "color") {
      return (
        <div key={field.name} className="flex items-center p-[0_1.5vmin]">
          <label className="text-16 text-primary_dark_blue uppercase">
            {field.label} :
          </label>
          <input
            className="form-control text-14"
            type="color"
            name={field.name}
            value={data?.[field.name] || ""}
            onChange={onConfigChange}
          />
        </div>
      );
    }

    if (field.type === "gradientColor") {
      const colors = [
        {
          name: "gradientStart",
          value: data.gradientStart ?? extractedColors?.gradientStart,
          counterpart: "gradientEnd",
        },
        {
          name: "gradientEnd",
          value: data.gradientEnd ?? extractedColors?.gradientEnd,
          counterpart: "gradientStart",
        },
      ];

      return (
        <div key={field.name} className="text-14 p-[1vmin_1.5vmin]">
          <label className="text-15 text-primary_dark_blue uppercase mb-2">
            <strong>{field.label} :</strong>
          </label>
          <div className="flex flex-wrap gap-[0.5vmin]">
            {colors.map(({ name, value, counterpart }) => (
              <div key={name} className="flex items-center">
                <label className="text-17 capitalize text-primary_dark_blue">
                  {name} :
                </label>
                <input
                  type="color"
                  name={name}
                  value={value}
                  onChange={(e) =>
                    handleColorChange(
                      e,
                      counterpart,
                      data[counterpart] ?? extractedColors?.[counterpart]
                    )
                  }
                  className="form-control text-16"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (field.name === "strokeColor") {
      return (
        <div key={field.name} className="text-14 p-[1vmin_1.5vmin]">
          <label className="text-15 text-primary_dark_blue uppercase">
            {field.label} :
          </label>
          <input
            type="color"
            name="strokeColor"
            value={data.strokeColor}
            onChange={onConfigChange}
            className="form-control text-16"
          />
        </div>
      );
    }

    if (field.type === "switch") {
      const isChecked = data?.[field.name] || false;
      return (
        <div className="flex items-center gap-1 my-3" key={field.name}>
          <label className="text-13-bold uppercase">{field.label} :</label>

          <div style={switchStyles}>
            <label
              style={{
                ...switchContainerStyles,
                backgroundColor: isChecked ? "#009fdf" : "#939598",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                name={field.name}
                onChange={onConfigChange}
                style={inputStyles}
              />
              <div
                style={{
                  ...switchKnobStyles,
                  left: isChecked ? "calc(100% - 17px)" : "3px",
                }}
              />
            </label>
          </div>
        </div>
      );
    }

    if (field.type === "multi-select") {
      const options =
        field.options || [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
        ];

      const selectedValues = data?.[field.name] || [];
      const selectedOptions = options.filter((o) =>
        selectedValues.includes(o.value)
      );

      return (
        <div key={field.name} className="mb-2">
          <label className="text-13-bold uppercase">{field.label} :</label>

          <Select
            isMulti
            options={options}
            value={selectedOptions}
            onChange={(selected) => {
              const values = selected ? selected.map((o) => o.value) : [];
              onConfigChange({
                target: {
                  name: field.name,
                  value: values,
                  type: "multi-select",
                },
              });
            }}
            className="text-14"
            styles={{
              control: (base) => ({
                ...base,
                fontSize: "1.4vmin",
                minHeight: "30px",
              }),
              menu: (base) => ({
                ...base,
                fontSize: "1.4vmin",
              }),
            }}
          />
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="text-13-bold uppercase">{field.label} :</label>

        <select
          className="form-select"
          name={field.name}
          value={data?.[field.name] || ""}
          onChange={onConfigChange}
          style={{
            fontSize: "1.4vmin",
            width: "100%",
            borderRadius: ".3vmin",
            border: "none",
          }}
        >
          {(field.customOptionsKey
            ? getOptionsList(field.customOptionsKey)
            : field.options || []
          ).map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderSubSystemSelect = (data) => {
    // Normalize current value to array (handles array, string, or comma-separated string)
    const currentValue = data?.subComponentAssetId;
    const selectedIds = normalizeSubComponentAssetIds(currentValue);
    
    // Transform subComponentList to MultiSelect format (tag_name and display_name)
    const multiSelectData = subComponentList.map((subComponent) => ({
      tag_name: String(subComponent.entityID),
      display_name: subComponent.entityName
    }));

    // Get initial selected values in MultiSelect format
    const initialValues = selectedIds.map(id => {
      const subComponent = subComponentList.find(sc => String(sc.entityID) === String(id));
      return subComponent ? {
        tag_name: String(subComponent.entityID),
        display_name: subComponent.entityName
      } : null;
    }).filter(Boolean);

    // Handle multi-select change - store as array of IDs
    const handleMultiSelectChange = (selectedTags) => {
      // Extract IDs from selected tags and store as array
      const selectedIds = selectedTags ? selectedTags.map(tag => tag.tag_name) : [];
      
      const syntheticEvent = {
        target: {
          name: "subComponentAssetId",
          value: selectedIds, // Store as array
          type: "multi-select",
          checked: false,
        },
      };
      onConfigChange(syntheticEvent);
    };

    return (
      <div key="sub-system-select" className="p-[1vmin_1.5vmin]">
        <label className="text-16 text-primary_dark_blue uppercase">
          Sub Component:
        </label>

        <div style={{ minHeight: "3.5vmin", border: "1px solid #d1d5db", borderRadius: "0.3vmin" }}>
          <MultiSelectV2
            data={multiSelectData}
            onChange={handleMultiSelectChange}
            initialValues={initialValues}
            shouldUpdateSelected={false}
          />
        </div>
      </div>
    );
  };

  const data = getData(selectedEdgeId, config);
  const fieldsToRender = nodeTypesConfig[config?.nodeType]?.fields || [];

  if (!selectedNodeId && !selectedEdgeId) {
    return (
      <div className="h-100">
        <div className="flex justify-between items-center bg-primary_blue_bg p-[1vmin_1.5vmin]">
          <h3 className="text-16 font-bold text-primary_dark_blue uppercase">
            Configure Node
          </h3>
        </div>

        <p className="text-16 p-[2vmin_1.5vmin]">
          Please select a node/edge to configure
        </p>
      </div>
    );
  }

  if (selectedNodeId) {
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
  }

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
          value={config?.style?.strokeWidth || 2}
          onChange={(e) => {
            const width = parseInt(e.target.value) || 2;
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

export default NodeConfigurator;
