import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import InfoIcon from "@mui/icons-material/Info";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// Components
import { Tooltip } from "@mui/material";
import { ReactFlowProvider } from "@xyflow/react";
import Flow from "../../../../components/flow/Flow";
import FailureModeTable from "./components/failureModeTable/FailureModeTable";

// Store
import { isFailureModeAtom } from "../../store/OverviewStore";

const Overview = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { caseId } = useOutletContext();

  const [isFailureModeOpen, setIsFailureModeOpen] = useAtom(isFailureModeAtom);

  // -----------------------------------------------------
  // TEMPORARY STATIC DATA
  // -----------------------------------------------------
  const data = [
    {
      caseId: 1,
      entityId: 1,
      entityName: "Surface Condenser KT13001",
      entityDisplayName: "Surface Condenser KT13001",
      entityType: "sub_entity",
      entityDescription: "Surface Condenser KT13001",
      tagId: 882,
      modelId: 15,
      anomalyIndex: 24.54,
      anomalyPercentageChange: 2.54,
      failureMode: [
        {
          fmsId: 430,
          subComponentAssetId: 2,
          failureModeId: 474,
          failureModeName: "Ejector Nozzle Wear",
          failureModeDescription: "Ejector Nozzle Wear",
          failureSymptomsId: 1073,
          failureSymptomsName: "Others",
          suggestion:
            "Open, inspect/replace nozzles of ejectors in next available opportunity",
          anomaly: true,
          activeSince: "2024-01-01",
        },
        {
          fmsId: 431,
          subComponentAssetId: 3,
          failureModeId: 473,
          failureModeName: "flow Nozzle Wear",
          failureModeDescription: "Ejector Nozzle Wear",
          failureSymptomsId: 1083,
          failureSymptomsName: "Others failer mode",
          suggestion:
            "Open, inspect/replace nozzles of ejectors in next available opportunity 1",
          anomaly: true,
          activeSince: "2024-01-01",
        },
      ],
    },
     {
    caseId: 2,
    entityId: 2,
    entityName: "Process Stg1",
    entityDisplayName: "Process Stg1",
    entityType: "sub_entity",
    tagId: 115,
    modelId: 305,
    anomalyIndex: 33.8,
    anomalyPercentageChange: 4.2,
    failureMode: [
      {
        fmsId: 820,
        subComponentAssetId: 20,
        failureModeId: 931,
        failureModeName: "Impeller Fouling",
        failureModeDescription: "Fouling on impeller causing flow reduction",
        failureSymptomsId: 3102,
        failureSymptomsName: "Low Flow",
        suggestion: "Plan shutdown cleaning and inspect impeller blades",
        anomaly: false,
        activeSince: "2024-02-20"
      },
      {
        fmsId: 821,
        subComponentAssetId: 22,
        failureModeId: 932,
        failureModeName: "Stage Pressure Imbalance",
        failureModeDescription: "Pressure mismatch between stages",
        failureSymptomsId: 3105,
        failureSymptomsName: "Pressure Variation",
        suggestion: "Check inlet valves and ensure stage balancing control is stable",
        anomaly: false,
        activeSince: "2024-03-11"
      }
    ]
  }
  ];

  // Flatten Table Data
  const flattenData = (data) =>
    data.flatMap((entity) =>
      entity.failureMode.map((fm) => ({
        subSystem: entity.entityDisplayName,
        anomalyIndex: entity.anomalyIndex,
        anomalyPercentageChange: entity.anomalyPercentageChange,
        activeFailureSymptoms: fm.failureSymptomsName,
        activeFailureMode: fm.failureModeName,
        prescription: fm.suggestion,
        activeSince: fm.activeSince,
        anomaly: fm.anomaly,
        entityId: entity.entityId,
        failureModeId: fm.failureModeId,
      }))
    );

  const tableData = useMemo(() => flattenData(data), []);
console.log("TABLE DATA", tableData);
  return (
    // <div className="h-full bg-primary_blue_light">demo</div>
    <div className="flex flex-col  gap-[1vmin] h-full">
      <div className="flex flex-col gap-[1vmin] h-full">

        {/* ============================
            GRAPHICAL OVERVIEW SECTION
        ============================ */}
        <div className="w-full shadow-primaryShadowCard rounded-[0.5vmin]">
          <div className="flex justify-between border-b-[0.2vmin] border-primary_gray_14 px-[1vmin] py-[0.5vmin]">

            <div className="flex gap-[0.5vmin] items-center">
              <DashboardIcon className="h-[3vmin] w-[3vmin]" />
              <span className="text-14 mt-[0.5vmin] font-sabic_text_bold text-nowrap">
                GRAPHICAL OVERVIEW
              </span>

              <Tooltip
                placement="top"
                arrow
                title="GRAPHICAL OVERVIEW"
                slotProps={{ tooltip: { className: "customTooltip" } }}
              >
                <InfoIcon className="ml-[0.5vmin] icon-img" />
              </Tooltip>
            </div>

            <div className="flex items-center justify-center gap-[1vmin] px-[0.6vmin]">
              <div className="flex gap-[0.7vmin] items-center bg-primary_blue_light p-[.7vmin_1.4vmin]">
                <TrendingUpIcon className="h-[2.5vmin] w-[2.5vmin]" />
                <span className="text-12 text-primary_blue_border mt-[.5vmin] font-sabic_text_bold text-nowrap">
                  PERFORMANCE CURVE
                </span>
              </div>

              {/* TEMP redirect */}
              <div
                className="w-2 h-2 bg-primary_blue rounded-full cursor-pointer"
                onClick={() =>
                  params?.plant === "polypropylene"
                    ? navigate("/middle+east/saudi+kayan/olefins/24/overview")
                    : navigate("/middle+east/saudi+kayan/polypropylene/24/overview")
                }
              />
            </div>
          </div>

          <div className={`${isFailureModeOpen ? "h-[47vmin]" : "h-[85vmin]"} mt-[1vmin]`}>
            <ReactFlowProvider>
              <div className="h-full">
                <Flow showDeveloperMode={true} tableData={tableData} />
              </div>
            </ReactFlowProvider>
          </div>
        </div>

        {/* ============================
            FAILURE MODE SECTION
        ============================ */}
        <div className="w-full shadow-primaryShadowCard rounded-[0.5vmin] px-[0.2vmin] py-[1vmin] min-h-[4.5vmin] mt-[1vmin]">
          <div className="flex justify-between items-center px-[1vmin]">
            
            <div className="flex gap-[1vmin] items-center">
              <WarningIcon className="h-[2vmin] w-[2vmin]" />
              <span className="text-14 font-sabic_text_bold mt-[0.5vmin] text-nowrap">
                FAILURE MODES
              </span>

              <Tooltip
                placement="top"
                arrow
                title="FAILURE MODES"
                slotProps={{ tooltip: { className: "customTooltip" } }}
              >
                <InfoIcon className="ml-[0.5vmin] icon-img" />
              </Tooltip>
            </div>

            <div
              onClick={() => setIsFailureModeOpen(!isFailureModeOpen)}
              className="cursor-pointer"
            >
              <KeyboardArrowDownIcon
                className={`icon-img bg-primary_blue_bg transition-all duration-500 ${
                  !isFailureModeOpen ? "rotate-[-180deg]" : ""
                }`}
              />
            </div>
          </div>

          {isFailureModeOpen && (
            <div className="h-[35vmin] relative w-full border-t-[0.2vmin] border-primary_gray_14 mt-[1vmin] p-1">
              <FailureModeTable data={tableData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
