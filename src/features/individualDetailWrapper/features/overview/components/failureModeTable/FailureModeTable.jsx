import { useReactTable, flexRender, getCoreRowModel } from "@tanstack/react-table";
import { computeRowSpanForColumn, getColumns } from "./FailureModeTable.function";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { failureNodeClickedAtom } from "../../../../store/OverviewStore";

const FailureModeTable = ({ data }) => {
  const failureNodeClicked = useAtomValue(failureNodeClickedAtom);

  const [subSystemModalOpen, setSubSystemModalOpen] = useState(false);
  const [isAnomalyIndexModal, setIsAnomalyIndexModal] = useState(false);
  const [isTimeEstimationTrendModal, setIsTimeEstimationTrendModal] = useState(false);
  const [isParameterTrendModal, setIsParameterTrendModal] = useState(false);

  const tableContainerRef = useRef(null);
  const highlightedRowRef = useRef(null);

  const onSubSystemModalClick = () => setSubSystemModalOpen(true);
  const onAnomalyIndexModalClick = () => setIsAnomalyIndexModal(true);
  const onTimeEstimationModalClick = () => setIsTimeEstimationTrendModal(true);
  const onParameterTrendModalClick = () => setIsParameterTrendModal(true);

  const table = useReactTable({
    columns: getColumns(
      onSubSystemModalClick,
      onAnomalyIndexModalClick,
      onTimeEstimationModalClick,
      onParameterTrendModalClick
    ),
    data,
    getCoreRowModel: getCoreRowModel()
  });

  const baseRows = table.getRowModel().rows;

  const renderGroupedCell = (cell, spanMap, meta, extraClass) => {
    const info = spanMap.get(cell.row.id);
    if (!info?.isFirst) return null;

    return (
      <td
        key={cell.id}
        rowSpan={info.rowSpan}
        className={`text-12 h-[5vmin] p-[1vmin] text-center uppercase ${extraClass ?? ""} ${
          meta?.cellClass ?? ""
        }`}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  };

  const renderDefaultCell = (cell, meta) => (
    <td
      key={cell.id}
      className={`font-sabic_text_regular text-12 h-[5vmin] p-[1.5vmin] text-left uppercase ${
        meta?.cellClass ?? ""
      }`}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );

  const renderCell = (cell, maps) => {
    const meta = cell.column.columnDef.meta;
    const colId = cell.column.id;

    if (colId === "subSystem" || colId === "anomalyIndex") {
      return renderGroupedCell(cell, maps.rowSpanSubsystem, meta);
    }

    return renderDefaultCell(cell, meta);
  };

  const { visibleRows, rowSpanSubsystem } = useMemo(() => {
    const groupMap = {};

    for (const r of baseRows) {
      const key = r.getValue("subSystem");
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(r);
    }

    const visible = Object.values(groupMap).flat();
    const subsystemSpan = computeRowSpanForColumn(visible, "subSystem");

    return {
      visibleRows: visible,
      rowSpanSubsystem: subsystemSpan
    };
  }, [baseRows]);

  useEffect(() => {
    if (highlightedRowRef.current && failureNodeClicked) {
      setTimeout(() => {
        highlightedRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest"
        });
      }, 100);
    }
  }, [failureNodeClicked, visibleRows]);

  return (
    <div ref={tableContainerRef} className="max-w-full h-full overflow-x-auto overflow-y-auto grow">
      <table className="table-fixed shadow-[0px_0px_3px_0px_#00000029] w-full">
        <thead className="bg-primary_blue_bg sticky top-0 uppercase">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="sticky top-0 z-30">
              {hg.headers.map(header => {
                const meta = header.column.columnDef.meta;

                return (
                  <th
                    key={header.id}
                    className={`font-sabic_text_regular text-14 relative py-[1.5vmin] px-[2vmin] text-center 
                      after:absolute after:top-[20%] after:right-0 after:bottom-[20%] after:w-[0.1vmin] ${
                        meta?.headerClass ?? ""
                      }`}
                    style={{
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "break-word"
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {visibleRows.length ? (
            visibleRows.map(row => {
              const rowEntityId = row.original?.entityId;

              const isHighlighted =
                failureNodeClicked &&
                rowEntityId !== undefined &&
                String(failureNodeClicked) === String(rowEntityId);

              return (
                <tr
                  key={row.id}
                  ref={isHighlighted ? highlightedRowRef : null}
                  className={`text-12 border-primary_gray_4 py-1 border-b ${
                    isHighlighted ? "bg-red-200" : "bg-primary_white"
                  }`}
                >
                  {row.getVisibleCells().map(cell =>
                    renderCell(cell, { rowSpanSubsystem })
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={table.getAllLeafColumns().length} className="p-4 text-center">
                No Data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FailureModeTable;
