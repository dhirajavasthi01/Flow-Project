import { useAtom, useAtomValue, useSetAtom } from "jotai";
import NodesList from "./NodesList";
import { developerModeAtom, isFullViewAtom, showHandlesAtom } from "../../features/individualDetailWrapper/store/OverviewStore";
import HandleNodeList from "./HandleNodeList";
import Flow from "./Flow";
import NodeConfigurator from "./NodeConfigurator";
import TemplateSidebar from "./TemplateSidebar";
const App = () => {
    const [show] = useAtom(showHandlesAtom)
    const isDeveloperMode = useAtomValue(developerModeAtom);
    const isFullView = useAtomValue(isFullViewAtom);
    return (
        <>
            <div className="flex h-full ">
                {isDeveloperMode && !isFullView && (
                    <div className="flex-1 border border-primary_gray_9 max-h-full overflow-y-auto">
                        {show && <HandleNodeList />}
                        <NodesList />
                        <TemplateSidebar />
                    </div>
                )}
                 <div className={`${isDeveloperMode && isFullView ?"flex-2" : "flex-4" }  border border-primary_gray_9`}>
                    <Flow showDeveloperMode={true} />
                </div>
                {isDeveloperMode && !isFullView && (
                    <div className="flex-1 border border-primary_gray_9">
                        <NodeConfigurator />
                    </div>
                )}
            </div>
        </>
    )
}
export default App;