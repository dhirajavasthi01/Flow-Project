import { useAtom } from "jotai";
import { developerModeAtom } from "../../store/OverviewStore";

import { ReactFlowProvider } from "@xyflow/react";
import Flow from "../../../../components/flow";
import { useNavigate } from "react-router-dom";

export default function Edit() {
  const [isDeveloperMode, setDeveloperMode] = useAtom(developerModeAtom);
  const navigate = useNavigate()
  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ width: "100%", height: "100vh" }}>
      
      {/* Top Bar */}
      <div className="flex items-center w-full h-[5vmin] py-[0.5vmin]">
        <div className="flex items-center h-full mx-5 gap-2 relative">
          <button
            onClick={() => setDeveloperMode(!isDeveloperMode)}
            id="developer-mode-button"
            data-testid="developer-mode-button"
            className="flex justify-center items-center uppercase text-[1.4vmin] font-medium bg-primary_blue text-white border-none rounded-[0.3vmin] h-full px-[1.5vmin] py-[0.25vmin] hover:bg-primary_blue_hover transition"
          >
            {isDeveloperMode ? "Exit Developer Mode" : "Enter Developer Mode"}
          </button>
        </div>
          <div className="flex items-center h-full mx-5 gap-2 relative">
          <button
            onClick={() => navigate('/overview')}
            id="developer-mode-button"
            data-testid="developer-mode-button"
            className="flex justify-center items-center uppercase text-[1.4vmin] font-medium bg-primary_blue text-white border-none rounded-[0.3vmin] h-full px-[1.5vmin] py-[0.25vmin] hover:bg-primary_blue_hover transition"
          >
            OverView
          </button>
        </div>
      </div>

      {/* Network Flow Section */}
      <div className="w-full h-[calc(100%-5vmin)]" style={{ width: "100%", height: "calc(100% - 5vmin)" }}>
       <ReactFlowProvider> <Flow /></ReactFlowProvider>
        {/* <ReactFlowProvider>
          <div style={{ width: "100%", height: "100%" }}>
            <Flow />
          </div>
        </ReactFlowProvider> */}
      </div>

    </div>
  );
}
