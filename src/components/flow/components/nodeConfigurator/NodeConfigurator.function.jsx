import React, { Suspense } from "react";
import { normalizeSubComponentAssetIds } from "../../../../utills/flowUtills/FlowUtills";
import MultiSelectV2  from '../../../multiSelect/MultiSelect'

export const renderTextField = (field, data, onConfigChange) => (
    <div
        key={field.name}
        className="flex flex-nowrap p-[0.5vmin_1.5vmin] items-center"
    >
        <label className="text-14 text-primary_gray font-sabic_text_bold whitespace-nowrap uppercase">
            {field.label} :
        </label>
        <input
            className="text-14 focus:outline-[0.2vmin] focus:outline-primary_blue p-[0.5vmin_0.5vmin] flex-grow ml-[0.5vmin] border border-primary_gray_2 rounded-[.4vmin]"
            type="text"
            name={field.name}
            value={data?.[field.name] || ""}
            onChange={onConfigChange}
        />
    </div>
);

export const renderNumberField = (field, data, onConfigChange) => (
    <div key={field.name} className="mb-2 border border-red-500">
        <label className="text-24 text-primary_gray font-sabic_text_bold uppercase">{field.label} :</label>
        <input
            className="form-control text-14-regular"
            type="number"
            name={field.name}
            value={data?.[field.name] || ""}
            min={field.min}
            onChange={onConfigChange}
        />
    </div>
);

export const renderColorField = (field, data, onConfigChange) => (
    <div key={field.name} className="flex items-center p-[0vmin_1.5vmin]">
        <label className="text-14 text-primary_gray uppercase">
            {field.label} :
        </label>
        <input
            className="form-control text-14"
            type="color"
            name={field.name}
            value={data?.[field.name] || ""}
            onChange={onConfigChange}
        />
    </div>
);

const handleColorChange = (e, counterpartName, counterpartValue, onConfigChange) => {
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

export const renderGradientColorField = (field, data, onConfigChange, extractedColors) => {
    const colors = [
        {
            name: "gradientStart",
            value: data.gradientStart ?? extractedColors?.gradientStart,
            counterpart: "gradientEnd",
        },
        {
            name: "gradientEnd",
            value: data.gradientEnd ?? extractedColors?.gradientEnd,
            counterpart: "gradientStart",
        },
    ];

    return (
        <div key={field.name} className="text-14 p-[1vmin_1.5vmin]">
            <label className="text-14 text-primary_gray uppercase mb-2">
                <strong>{field.label} :</strong>
            </label>
            <div className="flex flex-wrap gap-[0.5vmin]">
                {colors.map(({ name, value, counterpart }) => (
                    <div key={name} className="flex items-center">
                        <label className="text-14 text-primary_gray lineHeight1_3 uppercase">
                            {name} :
                        </label>
                        <input
                            type="color"
                            name={name}
                            value={value}
                            onChange={(e) =>
                                handleColorChange(
                                    e,
                                    counterpart,
                                    data[counterpart] ?? extractedColors?.[counterpart],
                                    onConfigChange
                                )
                            }
                            className="form-control text-14"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

 export const renderStrokeColorField = (field, data, onConfigChange) => (
        <div key={field.name} className="text-14 p-[1vmin_1.5vmin]">
            <label className="text-14 text-primary_gray uppercase">
                {field.label} :
            </label>
            <input
                type="color"
                name="strokeColor"
                value={data.strokeColor || ""}
                onChange={onConfigChange}
                className="form-control text-14"
            />
        </div>
    );


 export const renderSubSystemSelect = (data,subComponentList,onConfigChange) => {
        const currentValue = data?.subComponentAssetId;
        const selectedIds = normalizeSubComponentAssetIds(currentValue);

        const multiSelectData = subComponentList.map((subComponent) => ({
            tag_name: String(subComponent.assetID),
            display_name: subComponent.assetName
        }));

        const initialValues = selectedIds.map(id => {
            const subComponent = subComponentList.find(sc => String(sc.assetID) === String(id));
            return subComponent ? {
                tag_name: String(subComponent.assetID),
                display_name: subComponent.assetName
            } : null;
        }).filter(Boolean);

        const handleMultiSelectChange = (selectedTags) => {

            const selectedIds = selectedTags ? selectedTags.map(tag => tag.tag_name) : [];

            const syntheticEvent = {
                target: {
                    name: "subComponentAssetId",
                    value: selectedIds,
                    type: "multi-select",
                    checked: false,
                },
            };
            onConfigChange(syntheticEvent);
        };

        return (
            <div key="sub-system-select" className="p-[1vmin_1.5vmin] flex items-center gap-[1vmin]">
                <label className="text-nowrap mt-[.5vmin] text-14 text-primary_gray font-sabic_text_bold uppercase">
                    Asset :
                </label>
                <div style={{ borderRadius: "0.3vmin", width: "100%" }}>
                    <Suspense fallback={null}>
                        <MultiSelectV2
                            data={multiSelectData}
                            onChange={handleMultiSelectChange}
                            initialValues={initialValues}
                            shouldUpdateSelected={false}
                            isFullWidth={true}
                        />
                    </Suspense>
                </div>
            </div>
        )
    }