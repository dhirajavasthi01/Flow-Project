import { Panel } from "@xyflow/react";
import DrawerIcon from "../../../../../assets/images/common/drawer.svg";
import CloseIcon from "../../../../../assets/images/common/Close.svg";
import FailureModeLegend from "../../../../../assets/images/common/FailureModeLegend.svg";
import NewFailureModeLegend from "../../../../../assets/images/common/NewFailureMode.svg";

/**
 * Helper function to get drawer rotation classes based on legend position
 */
const getDrawerRotationClass = (legendPosition) => {
  if (!legendPosition) return "";
  if (legendPosition.includes("top-center")) return "rotate-[270deg] mt-[-2vmin]";
  if (legendPosition.includes("bottom-center")) return "rotate-90 mb-[-2vmin]";
  if (legendPosition.includes("left")) return "rotate-180";
  if (legendPosition.includes("right")) return "rotate-0";
  return "";
};

/**
 * LegendPanel Component
 * Renders the failure mode legend panel with drawer toggle
 */
const LegendPanel = ({
  legendPosition = "bottom-right",
  showDrawer = false,
  setShowDrawer,
}) => {
  const handleDrawerToggle = (e) => {
    e?.stopPropagation();
    setShowDrawer(!showDrawer);
  };

  return (
    <Panel
      position={legendPosition}
      className="p-0 m-0 flex flex-col items-end gap-2"
    >
      {showDrawer ? (
        <div
          className={`my-1 ${getDrawerRotationClass(legendPosition)}`}
          onClick={handleDrawerToggle}
        >
          <img src={DrawerIcon} alt="" className="cursor-pointer" />
        </div>
      ) : (
        <div
          className={`w-fit m-2 ${
            legendPosition?.includes("bottom-right") ? "mr-[7vmin]" : ""
          }`}
        >
          <div className="flex justify-end" onClick={handleDrawerToggle}>
            <img
              src={CloseIcon}
              className="bg-gray-200 rounded-full w-2 cursor-pointer"
              alt=""
            />
          </div>
          <div className="flex items-center gap-[.5vmin] uppercase p-[.5vmin_1vmin] text-12 bg-primary_yellow_bg font-medium">
            <div className="h-[1.8vmin] w-[1.8vmin]">
              <img src={FailureModeLegend} alt="" />
            </div>
            <p className="text-primary_gray mt-[.4vmin] font-sabic_text_bold">
              HOVER OVER THE RED-COLORED OBJECT TO VIEW THE FAILURE MODE
            </p>
          </div>
          <div className="flex items-center gap-[.5vmin] uppercase p-[.0vmin_1vmin] text-12 bg-primary_yellow_bg font-medium">
            <div className=" w-[2.8vmin] blink node-blink">
              <img
                src={NewFailureModeLegend}
                className="ml-[-.45vmin]"
                alt=""
              />
            </div>
            <p className="text-primary_gray mt-[.4vmin] font-sabic_text_bold ml-[-.9vmin]">
              NEW FAILURE MODE
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
};

export default LegendPanel;
