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
        { label: "Vertical", value: "vertical" },
      ],
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
    orientation: "horizontal",
  },
};

const binarySearchFontSize = (
  textRef,
  targetWidth,
  targetHeight,
  minSize = 1,
  maxSize = 500,
) => {
  let low = minSize;
  let high = maxSize;
  let bestFit = minSize;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    textRef.style.fontSize = `${mid}px`;
    const textWidth = textRef.scrollWidth;
    const textHeight = textRef.scrollHeight;
    if (textWidth <= targetWidth && textHeight <= targetHeight) {
      bestFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return bestFit;
};
const refineFontSizeForHeight = (textRef, targetHeight, initialFit) => {
  let low = 1;
  let high = initialFit;
  let finalFit = 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    textRef.style.fontSize = `${mid}px`;
    const textHeight = textRef.scrollHeight;
    if (textHeight <= targetHeight) {
      finalFit = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return finalFit;
};
export const calculateOptimalFontSize = (textRef, width, height) => {
  const parentWidth = width - 4;
  const parentHeight = height - 4;
  if (parentWidth <= 0 || parentHeight <= 0) {
    return 1;
  }
  const initialFit = binarySearchFontSize(textRef, parentWidth, parentHeight);
  const finalFit = refineFontSizeForHeight(textRef, parentHeight, initialFit);
  return finalFit;
};

export const formatTextContent = (rawText, orientation) => {
  if (orientation === "vertical") {
    return rawText.split("").join("<br/>");
  }
  return rawText;
};

export const getRawText = (tagData, label) => {
  if (tagData?.actual) {
    return tagData.actual;
  }
  return tagData ? "-" : label;
};

export const calculateAngle = (centerX, centerY, clientX, clientY) => {
  const deltaX = clientX - centerX;
  const deltaY = clientY - centerY;
  const angleRadians = Math.atan2(deltaY, deltaX) + Math.PI / 2;
  let newRotationDegrees = angleRadians * (180 / Math.PI);
  if (newRotationDegrees < 0) {
    newRotationDegrees += 360;
  } else if (newRotationDegrees >= 360) {
    newRotationDegrees -= 360;
  }
  return newRotationDegrees;
};
