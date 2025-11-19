import { Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import FolderIcon from "@mui/icons-material/Folder";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DescriptionIcon from "@mui/icons-material/Description";
import BarChartIcon from "@mui/icons-material/BarChart";

export const getColumns = (
  onSubSystemModalClick,
  onAnomalyIndexModalClick,
  onTimeEstimationModalClick,
  onParameterTrendModalClick
) => {
  return [
    {
      accessorKey: "subSystem",
      header: () => (
        <div className="font-sabic_text_bold text-12 flex flex-col items-center gap-1 text-center uppercase">
          <FolderIcon className="h-[3vmin] w-[3vmin]" />
          <span>SUB SYSTEM</span>
        </div>
      ),
      cell: ({ getValue, row }) => (
        <div className="px-1 flex justify-between w-full items-center">
          <div>{getValue()}</div>
          <InfoIcon
            onClick={() => onSubSystemModalClick(row.original)}
            className="cursor-pointer h-[2vmin] w-[2vmin]"
          />
        </div>
      ),
      meta: {
        headerClass:
          "font-sabic_text_regulat text-14 uppercase w-[8vmin] text-left",
        cellClass: "w-[8vmin] text-left text-12",
      },
    },

    {
      accessorKey: "anomalyIndex",
      header: () => (
        <div className="relative font-sabic_text_bold text-12 flex flex-col items-center gap-1 text-center uppercase">
          <AssessmentIcon className="h-[3vmin] w-[3vmin]" />
          <span>ANOMALY INDEX</span>
          <span className="text-10 absolute bottom-[-1.5vmin] text-primary_gray_18">
            (CHANGE)
          </span>
        </div>
      ),
      cell: ({ getValue, row }) => (
        <div className="px-1 flex justify-center gap-1 w-full items-center">
          <div>
            <div>{getValue()}</div>
            <div>({row.original.anomalyPercentageChange ?? "-"}%)</div>
          </div>
          <TrendingUpIcon
            className="cursor-pointer h-[3vmin] w-[3vmin]"
            onClick={() => onAnomalyIndexModalClick(row.original)}
          />
        </div>
      ),
      meta: {
        headerClass:
          "font-sabic_text_regulat text-12 uppercase w-[8vmin] text-center",
        cellClass: "w-[8vmin] text-center",
      },
    },

    {
      accessorKey: "activeFailureSymptoms",
      header: () => (
        <div className="font-sabic_text_bold text-12 flex flex-col items-center gap-1 text-center uppercase">
          <ErrorOutlineIcon className="h-[3vmin] w-[3vmin]" />
          <span>ACTIVE FAILURE SYSMPTOMS</span>
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <div className="px-1">
            <div>{value ? value : <span className="text-primary_gray_18">-</span>}</div>
          </div>
        );
      },
      meta: {
        headerClass:
          "font-sabic_text_regulat text-12 uppercase w-[15vmin] text-left",
        cellClass: "w-[15vmin] text-left",
      },
    },

    {
      accessorKey: "activeFailureMode",
      header: () => (
        <div className="font-sabic_text_bold text-12 flex flex-col items-center gap-1 text-center uppercase">
          <WarningIcon className="icon-img" />
          <span>ACTIVE FAILURE MODE</span>
        </div>
      ),
      cell: ({ getValue, row }) => {
        const value = getValue();
        return (
          <div className="flex justify-between items-center">
            <div className="px-1 flex flex-col text-left gap-1">
              <div>{value ? value : <span className="text-primary_gray_18">-</span>}</div>
              <div className="uppercase text-primary_gray_2">
                ACTIVE SINCE: {row.original?.activeSince ? row.original.activeSince : <span className="text-primary_gray_18">-</span>}
              </div>
            </div>
            <TrendingUpIcon
              onClick={() => onParameterTrendModalClick(row.original)}
              className="h-[3vmin] w-[3vmin] cursor-pointer"
            />
          </div>
        );
      },
      meta: {
        headerClass:
          "font-sabic_text_regulat text-11 uppercase w-[15vmin] text-left",
        cellClass: "w-[15vmin] text-left",
      },
    },

    {
      accessorKey: "prescription",
      header: () => (
        <div className="font-sabic_text_bold text-12 flex flex-col items-center gap-1 text-center uppercase">
          <DescriptionIcon className="h-[3vmin] w-[3vmin]" />
          <span>PRESCRIPTION</span>
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue();
        // Handle null/undefined values (when no failureMode)
        if (!value) {
          return (
            <div className="px-1 text-primary_gray_18">
              -
            </div>
          );
        }
        const isLong = value.length > 150;
        return (
          <div className="px-1">
            {isLong ? (
              <Tooltip
                placement="top-start"
                arrow
                title={value}
                slotProps={{ tooltip: { className: "customTooltip" } }}
              >
                <div>
                  {value.slice(0, 150)}{" "}
                  <span className="underline text-primary_blue">...MORE</span>
                </div>
              </Tooltip>
            ) : (
              <div>{value}</div>
            )}
          </div>
        );
      },
      meta: {
        headerClass:
          "font-sabic_text_regulat text-11 uppercase w-[15vmin] text-left",
        cellClass: "w-[15vmin] text-left",
      },
    },

    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="px-1 flex justify-center gap-1 w-full items-center">
          <BarChartIcon
            className="cursor-pointer icon-img"
            onClick={() => onTimeEstimationModalClick(row.original)}
          />
          <InfoIcon className="cursor-pointer h-[2vmin] w-[2vmin]" />
        </div>
      ),
      meta: {
        headerClass:
          "font-sabic_text_regulat text-11 uppercase w-[3vmin] text-left",
        cellClass: "w-[3vmin] text-left",
      },
    },
  ];
};

export function computeRowSpanForColumn(rows, columnId) {
  const spanMap = new Map();
  let i = 0;

  while (i < rows.length) {
    const currentRow = rows[i];
    const currentValue = currentRow.getValue(columnId);
    let count = 1;

    for (let j = i + 1; j < rows.length; j++) {
      if (rows[j].getValue(columnId) === currentValue) count++;
      else break;
    }

    spanMap.set(currentRow.id, { rowSpan: count, isFirst: true });

    for (let j = i + 1; j < i + count; j++) {
      spanMap.set(rows[j].id, { rowSpan: 0, isFirst: false });
    }

    i += count;
  }

  return spanMap;
}

export const mechanicalParameters = [
  {
    parameter: "CGC MP DE MAX VIBRATIONS",
    actualValue: 12.27,
    smeLowLimit: 0,
    smeHighLimit: 35,
    actualDeviation: "NORMAL",
  },
  {
    parameter: "CGC MP DE PRI SGS FLOWRATE STATE",
    actualValue: 1,
    smeLowLimit: "NA",
    smeHighLimit: "NA",
    actualDeviation: "HIGH",
  },
  {
    parameter: "CGC MP DE PRIMARY SEAL GAS PDI",
    actualValue: 0.8,
    smeLowLimit: 0.4,
    smeHighLimit: 0.8,
    actualDeviation: "NORMAL",
  },
  {
    parameter:
      "CGC MP DE PRIMARY SEAL GAS SUPPLY PDIC OP STATE",
    actualValue: 1,
    smeLowLimit: "NA",
    smeHighLimit: "NA",
    actualDeviation: "LOW",
  },
  {
    parameter: "CGC MP DE PRIMARY SEAL GAS SUPPLY PDV OP",
    actualValue: 77.8,
    smeLowLimit: 25,
    smeHighLimit: 75,
    actualDeviation: "HIGH",
  },
  {
    parameter: "CGC MP DE PRIMARY SEAL VENT FLOWRATE",
    actualValue: 42.9,
    smeLowLimit: 39,
    smeHighLimit: 45,
    actualDeviation: "NORMAL",
  },
  {
    parameter:
      "CGC MP DE PRIMARY VENT AND FLARE HEADER PRESSURE PDI",
    actualValue: 1,
    smeLowLimit: "NA",
    smeHighLimit: "NA",
    actualDeviation: "LOW",
  },
  {
    parameter: "CGC MP DE REFERENCE GAS LINE STATUS",
    actualValue: 1,
    smeLowLimit: "NA",
    smeHighLimit: "NA",
    actualDeviation: "NORMAL",
  },
];
