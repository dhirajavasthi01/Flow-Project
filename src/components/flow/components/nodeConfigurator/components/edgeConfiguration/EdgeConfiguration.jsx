import { edgeOptions } from "../../../../../../utills/flowUtills/FlowUtills";
const EdgeConfiguration = ({
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
      <div className="flex justify-between items-center bg-primary_blue_bg p-[1.5vmin]  border-b-[0.025vmin] border-b-primary_gray_3 ">
        <h3 className="text-14 text-primary_dark_blue uppercase font-sabic_text_bold">
          Configure Node
        </h3>
      </div>
      <p className="text-14 p-[1vmin_1.5vmin] text-primary_gray uppercase font-sabic_text_bold">
        Edge id :{" "}
        <span className="ml-1 text-12 text-primary_gray_2 break-keep font-sabic_text_regular">
          {config.id}
        </span>
      </p>
      <div className="p-[1vmin_1.5vmin] flex items-center whitespace-nowrap">
        <label className="text-14 text-primary_gray font-sabic_text_bold uppercase mr-1">
          Edge Type :{" "}
        </label>
        <select
          className="form-select text-15 border border-primary_gray_2 p-[.7vmin_.5vmin] outline-primary_blue"
          name={"type"}
          value={data?.type || ""}
          onChange={onEdgeConfigChange}
          style={{
            fontSize: "1.4vmin",
            borderRadius: ".3vmin",
          }}
        >
          {edgeOptions.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </select>
      </div>

      <div className="p-[1vmin_1.5vmin] flex items-center whitespace-nowrap">
        <label className="text-14 text-primary_gray font-sabic_text_bold uppercase mr-1">
          Edge Color :{" "}
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
              markerEnd: prev.markerEnd
                ? { ...prev.markerEnd, color }
                : prev.markerEnd,
            }));
          }}
          className="form-control text-16"
          style={{ width: "100%", marginTop: "0.5vmin" }}
        />
      </div>

      <div className="p-[1vmin_1.5vmin] flex items-center whitespace-nowrap">
        <label className="text-14 text-primary_gray font-sabic_text_bold uppercase mr-1">
          Edge Width :{" "}
        </label>
        <input
          type="number"
          name="strokeWidth"
          min="1"
          max="20"
          step="1"
          value={config?.style?.strokeWidth ?? 5}
          onChange={(e) => {
            const width = parseInt(e.target.value);
            setConfig((prev) => ({
              ...prev,
              style: {
                ...prev.style,
                strokeWidth: width,
              },
            }));
          }}
          className="form-control text-14-regular"
          style={{
            width: "100%",
            marginTop: "0.5vmin",
            fontSize: "1.4vmin",
            padding: "0.5vmin",
          }}
        />
      </div>

      {config?.markerEnd && (
        <div className="p-[1vmin_1.5vmin] flex items-center whitespace-nowrap">
          <label className="text-14 text-primary_gray font-sabic_text_bold uppercase mr-1">
            Arrow Size :{" "}
          </label>
          <input
            type="number"
            name="arrowSize"
            min="5"
            max="50"
            step="1"
            value={config?.markerEnd?.width ?? 10}
            onChange={(e) => {
              const size = parseInt(e.target.value) || 10;
              setConfig((prev) => ({
                ...prev,
                markerEnd: prev.markerEnd
                  ? { ...prev.markerEnd, width: size, height: size }
                  : {
                      type: "arrowclosed",
                      width: size,
                      height: size,
                      color: prev.style?.stroke || "#000",
                    },
              }));
            }}
            className="form-control text-14-regular"
            style={{
              width: "100%",
              marginTop: "0.5vmin",
              fontSize: "1.4vmin",
              padding: "0.5vmin",
            }}
          />
        </div>
      )}

      <div className="flex justify-around p-[0vmin_1.5vmin] items-center mt-[1vmin] flex-wrap gap-[1vmin]">
        <button
          className={`bg-primary_blue hover:bg-primary_blue_hover text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}
          onClick={() => setShouldUpdateConfig(true)}
        >
          Apply
        </button>
        <button
          className={`bg-primary_black hover:bg-primary_gray text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}
          onClick={() => setSelectedEdgeId(null)}
        >
          Close
        </button>
        <button
          className={`bg-primary_orange hover:bg-primary_red_60 text-14 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}
          onClick={() => setDelete(true)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default EdgeConfiguration;
