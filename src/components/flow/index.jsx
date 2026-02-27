import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import NodesList from "./NodesList";
import {
    developerModeAtom,
    showHandlesAtom,
    selectedNodeIdAtom,
    selectedEdgeIdAtom
} from "../../features/individualDetailWrapper/store/OverviewStore";
import HandleNodeList from "./HandleNodeList";
import Flow from "./Flow";
import NodeConfigurator from "./NodeConfigurator";
import TemplateSidebar from "./TemplateSidebar";

const App = () => {
    const [show] = useAtom(showHandlesAtom);
    const isDeveloperMode = useAtomValue(developerModeAtom);

    const selectedNodeId = useAtomValue(selectedNodeIdAtom);
    const selectedEdgeId = useAtomValue(selectedEdgeIdAtom);

    const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(true);
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

    useEffect(() => {
        if (selectedNodeId || selectedEdgeId) {
            setIsRightDrawerOpen(true);
        } else {
            setIsRightDrawerOpen(false);
        }
    }, [selectedNodeId, selectedEdgeId]);

    return (
        <div className="flex h-full relative overflow-hidden bg-gray-50">
            {isDeveloperMode && (
                <div className="flex relative h-full">
                    <div className={`transition-all duration-300 ease-in-out border-r border-primary_gray_9 bg-white h-full overflow-y-auto overflow-x-hidden ${isLeftDrawerOpen ? "w-[20vw]" : "w-0 border-none"}`}>
                        <div className="min-w-[20vw]">
                            {show && <HandleNodeList />}
                            <NodesList />
                            <TemplateSidebar />
                        </div>
                    </div>

                    <button onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)} className="absolute mt-8 top-4 -right-4 z-10 bg-primary_blue text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors">
                        {isLeftDrawerOpen ? "‹" : "›"}
                    </button>
                </div>
            )}

            <div className="flex-grow border border-primary_gray_9 relative h-full bg-white">
                <Flow showDeveloperMode={true} />
            </div>

            {isDeveloperMode && (
                <div className="flex relative h-full">
                    <button
                        onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
                        className="absolute mt-8 top-4 -left-4 z-10 bg-primary_blue text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors"
                    >
                        {isRightDrawerOpen ? "›" : "‹"}
                    </button>

                    <div className={`transition-all duration-300 ease-in-out border-l border-primary_gray_9 bg-white h-full overflow-y-auto overflow-x-hidden ${isRightDrawerOpen ? "w-[20vw]" : "w-0 border-none" }`}>
                        <div className="min-w-[20vw] h-full">
                            <NodeConfigurator />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;