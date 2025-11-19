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
    entityId: 2,
    entityName: "LP DGS",
    entityDisplayName: "LP DGS",
    entityType: "sub_entity",
    tagId: 101,
    modelId: 202,
    anomalyIndex: 21.4,
    anomalyPercentageChange: 1.8,
    failureMode: [
      {
        fmsId: 801,
        subComponentAssetId: 1,
        failureModeId: 901,
        failureModeName: "Seal Gas Pressure Drop",
        failureModeDescription: "Low seal gas pressure in LP stage",
        failureSymptomsId: 3011,
        failureSymptomsName: "Low Seal Gas",
        suggestion: "Inspect seal gas supply line and ensure pressure regulation",
        anomaly: true,
        activeSince: 1735524000000 // 18 hr before (should blink)
      },
      {
        fmsId: 802,
        subComponentAssetId: 2,
        failureModeId: 902,
        failureModeName: "Bearing Temperature Rise",
        failureModeDescription: "LP bearing temperature increased above threshold",
        failureSymptomsId: 3015,
        failureSymptomsName: "High Temperature",
        suggestion: "Check lubrication flow and inspect bearing alignment",
        anomaly: false,
        activeSince: 1735416000000 // 2 days before (should NOT blink)
      }
    ]
  },

  {
    caseId: 2,
    entityId: 5,
    entityName: "Process Stg1",
    entityDisplayName: "Process Stg1",
    entityType: "sub_entity",
    tagId: 115,
    modelId: 305,
    anomalyIndex: 33.8,
    anomalyPercentageChange: 4.2,
    failureMode: []
  },

  {
    caseId: 3,
    entityId: 9,
    entityName: "Oil System",
    entityDisplayName: "Oil System",
    entityType: "sub_entity",
    tagId: 133,
    modelId: 409,
    anomalyIndex: 17.1,
    anomalyPercentageChange: 1.1,
    failureMode: [
      {
        fmsId: 900,
        subComponentAssetId: 9,
        failureModeId: 950,
        failureModeName: "Oil Filter Choking",
        failureModeDescription: "Oil filters getting partially blocked",
        failureSymptomsId: 3301,
        failureSymptomsName: "Low Oil Flow",
        suggestion: "Replace filters and verify oil cleanliness index",
        anomaly: true,
        activeSince: 1735416000000 // 2 days before (should NOT blink)
      },
      {
        fmsId: 901,
        subComponentAssetId: 9,
        failureModeId: 951,
        failureModeName: "Oil Pump Vibration",
        failureModeDescription: "Vibration observed in auxiliary oil pump",
        failureSymptomsId: 3304,
        failureSymptomsName: "Vibration",
        suggestion: "Inspect coupling and check pump alignment",
        anomaly: true,
        activeSince: 1735498800000 // 25 hours before (should NOT blink)
      }
    ]
  },

  {
    caseId: 4,
    entityId: 13,
    entityName: "Turbine KT13001",
    entityDisplayName: "Turbine KT13001",
    entityType: "sub_entity",
    tagId: 165,
    modelId: 515,
    anomalyIndex: 44.6,
    anomalyPercentageChange: 6.4,
    failureMode: [
      {
        fmsId: 950,
        subComponentAssetId: 4,
        failureModeId: 1001,
        failureModeName: "Blade Tip Erosion",
        failureModeDescription: "Erosion at turbine blade tips from steam impurities",
        failureSymptomsId: 3601,
        failureSymptomsName: "Efficiency Loss",
        suggestion: "Schedule inspection and consider blade replacement",
        anomaly: true,
        activeSince: 1735524000000 // 18 hr before (should blink)
      },
      {
        fmsId: 951,
        subComponentAssetId: 4,
        failureModeId: 1002,
        failureModeName: "Bearing Metal Debris",
        failureModeDescription: "Wear particles detected in lube oil sample",
        failureSymptomsId: 3607,
        failureSymptomsName: "Oil Contamination",
        suggestion: "Perform oil flushing and inspect bearing surfaces",
        anomaly: true,
        activeSince: 1735416000000 // 2 days before (should NOT blink)
      }
    ]
  },

  {
    caseId: 5,
    entityId: 3,
    entityName: "Surface Condenser KT13002",
    entityDisplayName: "Surface Condenser KT13002",
    entityType: "sub_entity",
    tagId: 188,
    modelId: 530,
    anomalyIndex: 28.9,
    anomalyPercentageChange: 3.3,
    failureMode: [
      {
        fmsId: 980,
        subComponentAssetId: 3,
        failureModeId: 1101,
        failureModeName: "Tube Leakage",
        failureModeDescription: "Water ingress due to tube crack",
        failureSymptomsId: 3905,
        failureSymptomsName: "Pressure Drop",
        suggestion: "Perform hydrotest and isolate leaking tube bundle",
        anomaly: true,
        activeSince: 1735498800000 // 25 hours before (should NOT blink)
      },
      {
        fmsId: 981,
        subComponentAssetId: 3,
        failureModeId: 1102,
        failureModeName: "Air Ingress",
        failureModeDescription: "Vacuum drop due to condenser air ingress",
        failureSymptomsId: 3909,
        failureSymptomsName: "Vacuum Loss",
        suggestion: "Inspect expansion joints and gland sealing system",
        anomaly: true,
        activeSince: 1735524000000 // 18 hr before (should blink)
      }
    ]
  }
];



  // Flatten Table Data
  const flattenData = (data) =>
    data.flatMap((entity) => {
      // If no failureMode, create a single disabled row
      if (!entity.failureMode || entity.failureMode.length === 0) {
        return [{
          subSystem: entity.entityDisplayName,
          anomalyIndex: entity.anomalyIndex,
          subComponentAssetId: entity.entityId, // Use entityId as fallback
          anomalyPercentageChange: entity.anomalyPercentageChange,
          activeFailureSymptoms: null,
          activeFailureMode: null,
          prescription: null,
          activeSince: null,
          anomaly: false,
          entityId: entity.entityId,
          failureModeId: null,
          hasFailureMode: false, // Flag to indicate no failureMode
        }];
      }
      
      // If failureMode exists, map over it as before
      return entity.failureMode.map((fm) => ({
        subSystem: entity.entityDisplayName,
        anomalyIndex: entity.anomalyIndex,
        subComponentAssetId: fm.subComponentAssetId,
        anomalyPercentageChange: entity.anomalyPercentageChange,
        activeFailureSymptoms: fm.failureSymptomsName,
        activeFailureMode: fm.failureModeName,
        prescription: fm.suggestion,
        activeSince: fm.activeSince,
        anomaly: fm.anomaly,
        entityId: entity.entityId,
        failureModeId: fm.failureModeId,
        hasFailureMode: true, // Flag to indicate failureMode exists
      }));
    });

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
