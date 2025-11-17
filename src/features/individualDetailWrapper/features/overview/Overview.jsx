import { useNavigate, useOutletContext, useParams } from "react-router-dom";


import { useMemo, useState } from "react";

import FailureModeTable from "./components/failureModeTable/FailureModeTable";

import { Tooltip } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { ReactFlowProvider } from "@xyflow/react";

import Flow from "../../../../components/flow/Flow";

import { useAtom } from "jotai";

import { isFailureModeAtom } from "../../store/OverviewStore";

// import { getSubComponent } from "../../../../services/FlowServices";

import { useQuery } from "@tanstack/react-query";

const Overview = () => {

    const params = useParams();

    const { caseId } = useOutletContext()

    const [isFailureModeOpen, setIsFailureModeOpen] = useAtom(isFailureModeAtom);

    const navigate = useNavigate();

 

    // const subComponentData = useQuery({

    //     queryKey: ["get_sub_component"],

    //     queryFn: () => getSubComponent(caseId),

    // });

 

    // console.log("subComponentData========>", subComponentData.data)


    const data = [

        {

            caseId: 1,

            entityId: 15,

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

                    failureSymptomsDescription: null,

                    suggestion: "Open, inspect/replace nozzles of ejectors in next available opportunity",

                    anomaly: true,

                    activeSince: "2024-01-01"

                },

                {

                    fmsId: 431,

                    subComponentAssetId: 3,

                    failureModeId: 473,

                    failureModeName: "flow Nozzle Wear",

                    failureModeDescription: "Ejector Nozzle Wear",

                    failureSymptomsId: 1083,

                    failureSymptomsName: "Others failer mode",

                    failureSymptomsDescription: null,

                    suggestion: "Open, inspect/replace nozzles of ejectors in next available opportunity 1",

                    anomaly: true,

                    activeSince: "2024-01-01"

                }

 

            ]

 

        }

 

    ]

    const flattenData = (data) => {

        return data.flatMap(entity =>

            entity.failureMode.map(fm => ({

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

    };

 

    const tableData = useMemo(()=> flattenData(data),[])

 

    return (

        <div className=" flex flex-col gap-[1vmin] h-[calc(100%-4vmin)]">

            {/* <GlobalNavigatorAndInfo breadcrumbOptions={breadcrumbOptions} /> */}

            {/* PAGE MAIN CONTENT */}

            <div className="flex flex-col gap-[1vmin] h-full">

                {/* GRAPHICAL OVERVIEW SECTION */}

                <div className={`w-full shadow-primaryShadowCard rounded-[0.5vmin] `}>

                    <div className="flex justify-between border-b-[0.2vmin] pb-0.3 border-primary_gray_14 px-[1vmin] py-[0.5vmin]">

                        <div className="flex gap-[0.5vmin] items-center">

                            <DashboardIcon className="h-[3vmin] w-[3vmin]" />

                            <span className="text-14 mt-[0.5vmin] font-sabic_text_bold text-nowrap">GRAPHICAL OVERVIEW</span>

                            <div>

                                <Tooltip

                                    placement="top"

                                    arrow

                                    title={"GRAPHICAL OVERVIEW"}

                                    slotProps={{

                                        tooltip: {

                                            className: "customTooltip",

                                        },

                                    }}

                                >

                                    <InfoIcon className="ml-[0.5vmin] icon-img" />

                                </Tooltip>

                            </div>

                        </div>

                        <div>

                            <div className=" flex  items-center justify-center gap-[1vmin] px-[0.6vmin]">

                                <div className="flex gap-[0.7vmin] items-center bg-primary_blue_light  p-[.7vmin_1.4vmin]">

                                    <TrendingUpIcon className="h-[2.5vmin] w-[2.5vmin]" />

                                    <span className="text-12 text-primary_blue_border mt-[.5vmin] font-sabic_text_bold text-nowrap">PERFORMANCE CURVE</span>

                                </div>

                                <div className="w-2 h-2 bg-primary_blue rounded-full cursor-pointer"

                                    // TEMPORARY

                                    onClick={() => { params?.plant == "polypropylene" ? navigate("/middle+east/saudi+kayan/olefins/24/overview") : navigate("/middle+east/saudi+kayan/polypropylene/24/overview") }}>

 

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className={` ${isFailureModeOpen ? "h-[35vmin]" : "h-[70vmin]"}  mt-[1vmin] `}>

                        <ReactFlowProvider>

                            <div className="h-full">

                                <Flow showDeveloperMode={true} />

                            </div>

                        </ReactFlowProvider>

 

                    </div>

                </div>

                {/* FAILURE MODES SECTION */}

                <div className="w-full  shadow-primaryShadowCard rounded-[0.5vmin] px-[0.2vmin] py-[1vmin]  min-h-[4.5vmin]  mt-[1vmin] ">

                    <div className="flex justify-between border-primary_gray_14 items-center px-[1vmin]" >

                        <div className="flex gap-[1vmin] items-center">

                            <WarningIcon className="h-[2vmin] w-[2vmin]" />

                            <span className="text-14 font-sabic_text_bold mt-[0.5vmin] text-nowrap ">FAILURE MODES</span>

                            <Tooltip

                                placement="top"

                                arrow

                                title={"FAILURE MODES"}

                                slotProps={{

                                    tooltip: {

                                        className: "customTooltip",

                                    },

                                }}

                            >

                                <InfoIcon className="ml-[0.5vmin] icon-img" />

                            </Tooltip>

                        </div>

                        <div onClick={() => setIsFailureModeOpen(!isFailureModeOpen)} className="cursor-pointer">

                            <KeyboardArrowDownIcon className={`icon-img bg-primary_blue_bg transition-all duration-500 ${!isFailureModeOpen ? 'rotate-[-180deg]' : ''} `} />

                        </div>

                    </div>

                    {isFailureModeOpen &&

                        <div className="h-[35vmin] relative w-full border-t-[0.2vmin] border-primary_gray_14 mt-[1vmin] p-1 ">

                            <FailureModeTable data={tableData} />

                        </div>}

                </div>

            </div>

        </div>

    )

}

 

export default Overview;

 