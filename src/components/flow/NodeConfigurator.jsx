import { useEffect, useState } from 'react'

import Select from 'react-select'

import { useAtom, useAtomValue, useSetAtom } from "jotai"

import {

    allTagsDataAtom,

    deleteAtom,

    nodeConfigAtom,

    selectedEdgeIdAtom,

    selectedNodeIdAtom,

    selectedPageAtom,

    updateConfigAtom,

    subSystemListAtom,

} from '../../features/individualDetailWrapper/store/OverviewStore'

import { nodeTypesConfig } from './NodeEdgeTypes'

import { edgeOptions, extractColorsFromSvg, text_box_resources } from '../../utills/flowUtills/FlowUtills'




const switchStyles = {

    display: 'flex',

    alignItems: 'center',

}

 

const switchContainerStyles = {

    position: 'relative',

    width: '40px',

    height: '20px',

    borderRadius: '20px',

    transition: 'background-color 0.3s ease',

}

 

const switchKnobStyles = {

    position: 'absolute',

    top: '50%',

    width: '14px',

    height: '14px',

    backgroundColor: 'white',

    borderRadius: '50%',

    transition: 'left 0.3s ease-in-out',

    transform: 'translateY(-50%)',

}

 

const inputStyles = {

    opacity: 0,

    position: 'absolute',

    top: 0,

    left: 0,

    width: '100%',

    height: '100%',

    cursor: 'pointer',

    zIndex: 1,

}

 

const NodeConfigurator = () => {

    const [config, setConfig] = useAtom(nodeConfigAtom)

    const setShouldUpdateConfig = useSetAtom(updateConfigAtom)

    const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom)

    const [selectedEdgeId, setSelectedEdgeId] = useAtom(selectedEdgeIdAtom)

    const setDelete = useSetAtom(deleteAtom)

    const selectedPage = useAtomValue(selectedPageAtom)

    const allTagsDataList = useAtomValue(allTagsDataAtom)

    const subSystemList = useAtomValue(subSystemListAtom)

    const [extractedColors, setExtractedColors] = useState(null)

 

    useEffect(() => {

        setConfig(null)

        setSelectedEdgeId(null)

        setSelectedNodeId(null)

    }, [selectedPage, setConfig, setSelectedEdgeId, setSelectedNodeId])

 

    useEffect(() => {

        if (config?.data?.svgPath) {

            extractColorsFromSvg(config.data.svgPath).then((colors) => {

                setExtractedColors(colors)

            })

        }

    }, [config?.data?.svgPath])

 

    const handleColorChange = (e, counterpartName, counterpartValue) => {

        onConfigChange(e);

        const syntheticEvent = {

            target: {

                name: counterpartName,

                value: counterpartValue,

                type: 'color',

                checked: false,

            },

        };

        onConfigChange(syntheticEvent);

    };

 

    const onConfigChange = (event) => {

        const { name, value, type, checked } = event.target

        if (type === 'multi-select') {

            setConfig((prev) => ({

                ...prev,

                data: {

                    ...prev.data,

                    [name]: value,

                },

            }))

        } else if (name === 'template') {

            const selectedData = text_box_resources.find((x) => x.id === value)

            setConfig((prev) => ({

                ...prev,

                data: {

                    ...prev.data,

                    [name]: value,

                    backgroundColor: selectedData.bgColor,

                    borderColor: selectedData.borderColor,

                },

            }))

        } else if (type === 'checkbox') {

            setConfig((prev) => ({

                ...prev,

                data: {

                    ...prev.data,

                    [name]: checked,

                },

            }))

        } else {

            setConfig((prev) => ({

                ...prev,

                data: {

                    ...prev.data,

                    [name]:

                        name === 'numSourceHandles' ||

                            name === 'numTargetHandles' ||

                            name === 'numSourceHandlesRight' ||

                            name === 'numTargetHandlesTop' ||

                            name === 'numSourceHandlesBottom' ||

                            name === 'numTargetHandlesLeft'

                            ? parseInt(value)

                            : value,

                },

            }))

        }

    }

 

    const onEdgeConfigChange = (event) => {

        const { name, value } = event.target

        setConfig((prev) => ({

            ...prev,

            [name]: value,

            markerEnd: value,

        }))

    }

 

    const getOptionsList = (key) => {

        if (key === 'subSystem') {

            return [

                { id: null, name: 'Select Sub System' },

                ...subSystemList.map((x) => ({

                    id: x.id,

                    name: x.name,

                })),

            ]

        }

        return []

    }

 

    const getData = (selectedEdgeId, config) => {

        if (selectedEdgeId) {

            return config

        } else {

            return config?.data

        }

    }

 

    const getInputField = (field, data) => {

        if (field.type === 'number') {

            return (

                <div key={field.name} className='mb-2 border border-red-500'>

                    <label className="text-13-bold text-uppercase">

                        {field.label} :{' '}

                    </label>

                    <input

                        className="form-control text-14-regular"

                        type="number"

                        name={field.name}

                        value={data?.[field.name] || ''}

                        min={field.min}

                        onChange={onConfigChange}

                    />

                </div>

            )

        }

 

        if (field.type === 'text') {

            return (

                <div key={field.name} className='flex flex-nowrap p-[0.5vmin_1.5vmin] items-center'>

                    <label className="text-16 text-primary_dark_blue whitespace-nowrap uppercase">{field.label} :{' '}</label>

                    <input

                        className="text-16 focus:outline-[0.2vmin] focus:outline-primary_blue p-[0.5vmin_0.5vmin] flex-grow ml-[0.5vmin] border border-primary_gray_2 rounded-[.4vmin]"

                        type="text"

                        name={field.name}

                        value={data?.[field.name] || ''}

                        onChange={onConfigChange}

                    />

                </div>

            )

        }

 

        if (field.type === 'color') {

            return (

                <div key={field.name} className='flex items-center p-[0vmin_1.5vmin]'>

                    <label className="text-16 text-primary_dark_blue uppercase">

                        {field.label} :{' '}

                    </label>

                    <input

                        className="form-control text-14"

                        type="color"

                        name={field.name}

                        value={data?.[field.name] || ''}

                        onChange={onConfigChange}

                    />

                </div>

            )

        }

 

        if (field.type === 'gradientColor') {

            const colors = [

                {

                    name: 'gradientStart',

                    value: data.gradientStart ?? extractedColors?.gradientStart,

                    counterpart: 'gradientEnd',

                },

                {

                    name: 'gradientEnd',

                    value: data.gradientEnd ?? extractedColors?.gradientEnd,

                    counterpart: 'gradientStart',

                },

            ];

            return (

                <div key={field.name} className='text-14 p-[1vmin_1.5vmin]'>

                    <label className="text-15 text-primary_dark_blue uppercase mb-2 ">

                        <strong>{field.label} :</strong>

                    </label>

                    <div className='flex flex-wrap gap-[0.5vmin]'>

                        {colors.map(({ name, value, counterpart }) => (

                            <>

                                <div className='flex items-center'>

                                    <label className='text-17 text-primary_dark_blue lineHeight1_3 capitalize'>{name} : </label>

                                <input

                                    key={name}

                                    type="color"

                                    name={name}

                                    value={value}

                                    onChange={(e) =>

                                        handleColorChange(

                                            e,

                                            counterpart,

                                            data[counterpart] ?? extractedColors?.[counterpart]

                                        )

                                    }

                                    className="form-control text-16"

                                />

                                </div>

                            </>

                        ))}

                    </div>

                </div>

            )

        }

 

        {

            if (field.name === 'strokeColor') {

                return (

                    <div key={field.name} className='text-14 p-[1vmin_1.5vmin] border border-red-500'>

                        <label className="text-15 text-primary_dark_blue uppercase ">

                            {field.label} :

                        </label>

                        <input

                            type="color"

                            name="strokeColor"

                            value={data.strokeColor}

                            onChange={onConfigChange}

                            className="form-control text-16 border border-red-500"

                        />

                    </div>

                );

            }

        }

 

        if (field.type === 'switch') {

            const isChecked = data?.[field.name] || false

            return (

                <div

                    className="flex items-center gap-1 my-3"

                    key={field.name}

                >

                    <label className="text-13-bold uppercase">

                        {field.label} :

                    </label>

                    <div className={``} style={switchStyles}>

                        <label

                            style={{

                                ...switchContainerStyles,

                                backgroundColor: isChecked ? '#009fdf' : '#939598',

                            }}

                        >

                            <input

                                type="checkbox"

                                checked={data?.[field.name] || ''}

                                name={field.name}

                                onChange={onConfigChange}

                                style={inputStyles}

                            />

                            <div

                                style={{

                                    ...switchKnobStyles,

                                    left: isChecked ? 'calc(100% - 17px)' : '3px',

                                }}

                            ></div>

                        </label>

                    </div>

                </div>

            )

        }

        if (field.type === 'multi-select') {

            const options = field.options || [

                { value: 'left', label: 'Left' },

                { value: 'right', label: 'Right' },

                { value: 'top', label: 'Top' },

                { value: 'bottom', label: 'Bottom' }

            ]

            const selectedValues = data?.[field.name] || []

 

            const selectedOptions = options.filter(option =>

                selectedValues.includes(option.value)

            )

 

            return (

                <div key={field.name} className='mb-2'>

                    <label className="text-13-bold text-uppercase">

                        {field.label} :

                    </label>

                    <Select

                        isMulti

                        options={options}

                        value={selectedOptions}

                        onChange={(selected) => {

                            const selectedValues = selected ? selected.map(option => option.value) : []

                            const syntheticEvent = {

                                target: {

                                    name: field.name,

                                    value: selectedValues,

                                    type: 'multi-select'

                                }

                            }

                            onConfigChange(syntheticEvent)

                        }}

                        className="text-14"

                        styles={{

                            control: (base) => ({

                                ...base,

                                fontSize: '1.4vmin',

                                minHeight: '30px'

                            }),

                            menu: (base) => ({

                                ...base,

                                fontSize: '1.4vmin'

                            })

                        }}

                    />

                </div>

            )

        }

        return (

            <div key={field.name} className='border border-red-500'>

                <label className="text-13-bold text-uppercase ">

                    {field.label} :{' '}

                </label>

                <select

                    className="form-select"

                    name={field.name}

                    value={data?.[field.name] || ''}

                    onChange={onConfigChange}

                    style={{

                        fontSize: '1.4vmin',

                        width: '100',

                        borderRadius: '.3vmin',

                        border: 'none',

                    }}

                >

                    {(field.customOptionsKey

                        ? getOptionsList(field.customOptionsKey)

                        : field.options || []

                    ).map((resource) => (

                        <option key={resource.id} value={resource.id}>

                            {resource.name}

                        </option>

                    ))}

                </select>

            </div>

        )

    }

 

    const renderSubSystemSelect = (data) => {

        return (

            <div key="sub-system-select" className='p-[1vmin_1.5vmin] '>

                <label className="text-16 text-primary_dark_blue uppercase">

                    Sub component :{' '}

                </label>

                <select

                    className="form-select border border-primary_gray_2 text-15 p-[0.8vmin_0.8vmin]"

                    name="subSystem"

                    value={data?.subSystem || ''}

                    onChange={onConfigChange}

                    style={{

                        fontSize: '1.4vmin',

                        width: '100',

                        borderRadius: '.3vmin'

                    }}

                >

                    <option value="" >Select Sub System</option>

                    {subSystemList.map((system) => (

                        <option key={system.id} value={system.id} className='active:bg-primary_blue'>

                            {system.name}

                        </option>

                    ))}

                </select>

            </div>

        )

    }

 

    const data = getData(selectedEdgeId, config)

    const fieldsToRender = nodeTypesConfig[config?.nodeType]?.fields || []

 

    if (!selectedNodeId && !selectedEdgeId) {

        return (

            <div className='h-100'>

                <div className='flex justify-between items-center bg-primary_blue_bg p-[1vmin_1.5vmin]'>

                    <h3 className="text-16 font-weight-700 text-primary_dark_blue uppercase">Configure Node</h3>

                </div>

                <p className="text-16  p-[2vmin_1.5vmin]">

                    Please select a node/edge to configure

                </p>

            </div>

        )

    }

 

    if (selectedNodeId) {

        return (

            <div className='h-100'>

                <div className='flex justify-between items-center bg-primary_blue_bg p-[1vmin_1.5vmin] '>

                    <h3 className="text-16 font-weight-700 text-primary_dark_blue uppercase">Configure Node</h3>

                </div>

 

                <div className='p-[1vmin_1.5vmin]'>

                    <p className="text-18 text-primary_dark_blue text-uppercase mb-1">

                        Node id :{' '}

                        <span className="text-13-bold text-primary_gray">{config.id}</span>

                    </p>

                    <p className="text-18 text-primary_dark_blue text-uppercase ">

                        Node Name :{' '}

                        <span className="text-13-bold text-primary_gray">

                            {config.name}

                        </span>

                    </p>

                </div>

                <>

                    {fieldsToRender.map((field) => getInputField(field, data))}

 

                    {renderSubSystemSelect(data)}

 

                    <div className="flex justify-around items-center mt-[1vmin] flex-wrap gap-[1vmin]">

                        <button

                            // ${styles.primaryBlueButton}

                            className={`

                                bg-primary_blue

                                 text-15 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase

                                 `}

                            onClick={() => {

                                // TRACKEVENTOBJ.network.ConfigNodeApplyClick({

                                //   params,

                                //   caseData: appContext.caseData,

                                // })

                                setShouldUpdateConfig(true)

                            }}

                        >

                            Apply

                        </button>

                        <button

                            // ${styles.primaryGrayButton}

                            className={` bg-primary_blue

                                 text-15 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}

                            onClick={() => {

                                // TRACKEVENTOBJ.network.ConfigNodeCloseClick({

                                //   params,

                                //   caseData: appContext.caseData,

                                // })

                                setSelectedNodeId(null)

                            }}

                        >

                            Close

                        </button>

                        <button

                            // ${styles.primaryRedButton}

                            className={` bg-primary_blue

                                 text-15 rounded-[0.3vmin] text-white p-[0.9vmin_2vmin] uppercase`}

                            onClick={() => {

                                // TRACKEVENTOBJ.network.ConfigNodeDeleteClick({

                                //   params,

                                //   caseData: appContext?.caseData,

                                // })

                                setDelete(true)

                            }}

                        >

                            Delete

                        </button>

                    </div>

 

                    <div className="text-16 text_primary_gray_2 text-uppercase p-[1vmin_1.5vmin]">

                        <b>Note : </b> All changes to the node will only be applied upon clicking

                        Apply button

                    </div>

                </>

            </div>

        )

    }

 

    return (

        <div className='h-100'>

            <h3 className="text-14-bold mb_1">Configure Edge</h3>

            <p className="text-18">

                Edge id : <span className="text_primary_gray_2">{config.id}</span>

            </p>

            <div>

                <label className="text-13-bold text-uppercase">Color : </label>

                <select

                    className="form-select"

                    name={'type'}

                    value={data?.type || ''}

                    onChange={onEdgeConfigChange}

                    style={{

                        fontSize: '1.4vmin',

                        width: '100%',

                        borderRadius: '.3vmin',

                        border: 'none',

                    }}

                >

                    {edgeOptions.map((resource) => (

                        <option key={resource.id} value={resource.id}>

                            {resource.name}

                        </option>

                    ))}

                </select>

            </div>

            <div className="d-flex flex-wrap gap-1 mt-2">

                <button

                    // ${styles.primaryBlueButton}

                    className={` text-14-regular text-uppercase`}

                    onClick={() => setShouldUpdateConfig(true)}

                >

                    Apply

                </button>

                <button

                    // ${styles.primaryGrayButton}

                    className={

                        `

                       

                    text-14-regular text-uppercase`}

                    onClick={() => setSelectedEdgeId(null)}

                >

                    Close

                </button>

                <button

                    // ${styles.primaryRedButton}

                    className={`

                       

                         text-14-regular text-uppercase`}

                    onClick={() => setDelete(true)}

                >

                    Delete

                </button>

            </div>

        </div>

    )

}

 

export default NodeConfigurator

 