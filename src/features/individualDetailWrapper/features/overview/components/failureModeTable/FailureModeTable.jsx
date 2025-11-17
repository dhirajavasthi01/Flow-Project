import { useReactTable, flexRender, getCoreRowModel } from "@tanstack/react-table";

import { computeRowSpanForColumn, getColumns, mechanicalParameters } from "./FailureModeTable.function";

import React, { Suspense, useMemo, useState } from "react";

const FailureModeTable = ({ data }) => {

  const [subSystemModalOpen, setSubSystemModalOpen] = useState(false);

  const [isAnomalyIndexModal, setIsAnomalyIndexModal] = useState(false);

  const [isTimeEstimationTrendModal, setIsTimeEstimationTrendModal] = useState(false);

  const [isParameterTrendModal, setIsParameterTrendModal] = useState(false);

 

  const onSubSystemModalClick = (row) => {

    setSubSystemModalOpen(true);

  }

 

  const onAnomalyIndexModalClick = (row) => {

    setIsAnomalyIndexModal(true);

  }

 

  const onTimeEstimationModalClick = (row) => {

    setIsTimeEstimationTrendModal(true);

  }

 

  const onParameterTrendModalClick = (row) => {

    setIsParameterTrendModal(true)

  }

 

  const table = useReactTable({

    columns: getColumns(onSubSystemModalClick, onAnomalyIndexModalClick, onTimeEstimationModalClick, onParameterTrendModalClick),

    data: data,

    getCoreRowModel: getCoreRowModel()

  });

 

  const baseRows = table.getRowModel().rows

  const renderGroupedCell = (

    cell,

    spanMap,

    meta,

    extraClass,

  ) => {

    const info = spanMap.get(cell.row.id)

    if (!info?.isFirst) return null

    return (

      <td

        key={cell.id}

        rowSpan={info.rowSpan}

        className={`text-12 h-[5vmin] p-[1vmin] text-center uppercase ${extraClass ?? ''} ${meta?.cellClass ?? ''}`}

      >

        {flexRender(cell.column.columnDef.cell, cell.getContext())}

      </td>

    )

  }

 

  const renderDefaultCell = (

    cell,

    meta

  ) => (

    <td

      key={cell.id}

      className={`font-sabic_text_regular text-12 h-[5vmin] p-[1.5vmin] text-left uppercase ${meta?.cellClass ?? ''}`}

    >

      {flexRender(cell.column.columnDef.cell, cell.getContext())}

    </td>

  )

 

  const renderCell = (

    cell,

    row,

    maps

  ) => {

    const meta = cell.column.columnDef.meta

    const colId = cell.column.id

    if (colId === 'subSystem') {

      return renderGroupedCell(cell, maps.rowSpanSubsystem, meta)

    } else if (colId === 'anomalyIndex') {

      return renderGroupedCell(cell, maps.rowSpanSubsystem, meta)

    }

    return renderDefaultCell(cell, meta)

  }

 

  const {

    visibleRows,

    rowSpanSubsystem,

  } = useMemo(() => {

    const groupMap = {}

    for (const r of baseRows) {

      const subsystem = r.getValue('subSystem')

      const key = subsystem

 

      if (!groupMap[key]) groupMap[key] = []

      groupMap[key].push(r)

    }

 

    const visible = []

 

    Object.entries(groupMap).forEach(([key, rows]) => {

      rows.forEach((r, idx) => {

        visible.push(r)

      })

    });

 

    // Compute rowSpan for subsystem & affiliateName based on visible rows only

 

    const subsystemSpan = computeRowSpanForColumn(visible, 'subSystem')

 

    return {

      visibleRows: visible,

      rowSpanSubsystem: subsystemSpan,

    }

  }, [baseRows])

 

  return (

    <div className="max-w-full h-full overflow-x-auto grow">

      <table className="table-fixed shadow-[0px_0px_3px_0px_#00000029] w-full">

        <thead className="bg-primary_blue_bg sticky top-0 uppercase">

          {table.getHeaderGroups().map(hg => (

            <tr key={hg.id} className='sticky top-0 z-30'>

              {hg.headers.map(header => {

                const meta = header.column.columnDef.meta

                return (

                  <th

                    key={header.id}

                    className={

                      `font-sabic_text_regular text-14 font-500 relative py-[1.5vmin] px-[2vmin] text-center after:absolute after:top-[20%] after:right-[0vmin] after:bottom-[20%] after:w-[0.1vmin] ${meta?.headerClass ?? ''} `

                    }

                    style={{

                      whiteSpace: 'normal',

                      wordBreak: 'break-word',

                      overflowWrap: 'break-word'

                    }}

                  >

                    {flexRender(

                      header.column.columnDef.header,

                      header.getContext()

                    )}

                  </th>

                )

              })}

            </tr>

          ))}

        </thead>

        <tbody>

          {visibleRows.length ? (

            <>

              {visibleRows.map(row => (

                <tr

                  key={row.id}

                  className='text-12 border-primary_gray_4 py-1 bg-primary_white border-b'

                >

                  {row.getVisibleCells().map(cell =>

                    renderCell(

                      cell,

                      row,

                      { rowSpanSubsystem },

 

                    )

                  )}

                </tr>

              ))}

            </>

          ) : (

            <tr>

              <td

                colSpan={table.getAllLeafColumns().length}

                className='p-4 text-center'

              >

                No Data

              </td>

            </tr>

          )}

 

        </tbody>

      </table>
    </div>

  )

}

 

export default FailureModeTable;

 