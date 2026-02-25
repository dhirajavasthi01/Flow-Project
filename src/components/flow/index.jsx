import { useAtom, useAtomValue } from "jotai";
import {
  developerModeAtom,
  isFullViewAtom,
  showHandlesAtom,
} from "../../features/individualDetailWrapper/features/overview/store/OverviewStore";
import Flow from "./Flow";
import NodeConfigurator from "./components/nodeConfigurator/NodeConfigurator";
import HandleNodeList from "./components/handleNodeList/HandleNodeList";
import NodesList from "./components/nodeList/NodesList";
import TemplateSidebar from "./components/templateSidebar/TemplateSidebar";

const App = (props) => {
  const [show] = useAtom(showHandlesAtom);
  const isDeveloperMode = useAtomValue(developerModeAtom);
  const isFullView = useAtomValue(isFullViewAtom);
  const { legendPosition } = props;
  return (
    <>
      <div className="flex h-full ">
        {isDeveloperMode && (
          <div className="flex-1 border border-primary_gray_9 max-h-full overflow-y-auto">
            {show && <HandleNodeList />}
            <NodesList />
            <TemplateSidebar />
          </div>
        )}
        <div
          className={`${isDeveloperMode ? "flex-2" : "flex-4"}  border border-primary_gray_9`}
        >
          <Flow legendPosition={legendPosition} showDeveloperMode={true} />
        </div>
        {isDeveloperMode && (
          <div className="flex-1 border border-primary_gray_9">
            <NodeConfigurator />
          </div>
        )}
      </div>
    </>
  );
};
export default App;
