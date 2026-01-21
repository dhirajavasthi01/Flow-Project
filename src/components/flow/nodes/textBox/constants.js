export const TextBoxNodeFieldConfig = {
    fields: [
        { label: "Label", name: "label", type: "text" },
        { label: "Text Color", name: "color", type: "color" },
        {
            label: "Orientation",
            name: "orientation",
            type: "select",
            options: [
                { label: "Horizontal", value: "horizontal" },
                { label: "Vertical", value: "vertical" }
            ]
        },
    ],
};

export const TextBoxNodeConfig = {
    name: "Textbox",
    nodeType: "text-box-node",
    type: "textBoxNode",
    position: { x: 0, y: 0 },
    data: {
        numSourceHandlesRight: 1,
        numTargetHandlesTop: 1,
        numSourceHandlesBottom: 1,
        numTargetHandlesLeft: 1,
        label: "Text Box Node",
        color: "#000000",
        rotation: 0,
        orientation: "horizontal"
    },
};
