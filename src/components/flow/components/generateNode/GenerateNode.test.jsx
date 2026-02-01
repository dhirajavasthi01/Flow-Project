import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
/* ========================== MOCKS ========================== */
vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({
    getNode: vi.fn(() => ({
      id: "1",
      nodeType: "test-node",
    })),
  }),
}));

vi.mock("../../hooks/useNodeCommon/useNodeCommon", () => ({
  useNodeCommon: () => ({
    isDeveloperMode: true,
    isSelected: true,
    isHighlighted: false,
    selectedId: "1",
  }),
}));
vi.mock("../baseSvgNode/BaseSvgNode", () => ({
  default: (props) => (
    <div data-testid="base-svg-node">
      <span data-testid="svgPath">{props.svgPath}</span>
      <span data-testid="isActive">
        {String(props.isNodeActive)}
      </span>
    </div>
  ),
}));
vi.mock("../svgMap/SvgMap", () => ({
  svgMap: {
    "test-node": "M10 10 H 90 V 90 H 10 Z",
  },
}));

vi.mock("../../../../utills/nodeNameUtils/nodeNameUtils", () => ({
  toPascalCase: () => "Test",
  toKebabCase: () => "test-node",
  toCamelCase: () => "testNode",
  getDisplayName: () => "Test Node",
}));
/* ========================== IMPORT SUBJECT ========================== */
import {
  generateNodeFieldConfig,
  generateNodeConfig,
  generateNodeComponent,
  generateNodeExports,
} from "./GenerateNode";
/* ========================== TESTS ========================== */
describe("generateNodeFieldConfig", () => {
  it("returns expected field configuration", () => {
    const result = generateNodeFieldConfig();
    expect(result).toEqual({
      fields: [
        { label: "Node Color", name: "nodeColor", type: "gradientColor" },
        { label: "Stroke Color", name: "strokeColor", type: "color" },
        { label: "Tooltip Content", name: "tooltipContent", type: "text" },
      ],
    });
  });
});
describe("generateNodeConfig", () => {
  it("returns valid node configuration", () => {
    const result = generateNodeConfig("MyNode");
    expect(result).toEqual({
      name: "Test Node",
      nodeType: "test-node",
      type: "testNode",
      position: { x: 0, y: 0 },
      data: {
        subSystem: null,
        nodeColor: undefined,
        strokeColor: undefined,
        nodeType: "test-node",
      },
    });
  });
});
describe("generateNodeComponent", () => {
  it("renders BaseSvgNode with resolved svgPath", () => {
    const Node = generateNodeComponent("MyNode");
    const { getByTestId } = render(
      <Node
        id="1"
        selected={true}
        type="testNode"
        data={{ width: 100, height: 80 }}
      />
    );

  });
  it("passes null svgPath if svgMap value is not string", async () => {
    const svg = await import("../svgMap/SvgMap");
    svg.svgMap["test-node"] = { invalid: true };
    const Node = generateNodeComponent("MyNode");
    const { getByTestId } = render(
      <Node id="1" selected={false} type="testNode" data={{}} />
    );
    expect(getByTestId("svgPath").textContent).toBe("");
  });
});
describe("generateNodeExports", () => {
  it("returns node exports successfully", () => {
    const result = generateNodeExports("MyNode");
    expect(result).toHaveProperty("TestNodeFieldConfig");
    expect(result).toHaveProperty("TestNodeConfig");
    expect(result).toHaveProperty("TestNode");
    expect(result.TestNodeFieldConfig.fields.length).toBe(3);
    expect(result.TestNodeConfig.nodeType).toBe("test-node");
  });
  it("returns null when an error is thrown", async () => {
    const utils = await import("../../../../utills/nodeNameUtils/nodeNameUtils");
    vi.spyOn(utils, "toPascalCase").mockImplementation(() => {
      throw new Error("failure");
    });
    const result = generateNodeExports("BrokenNode");
    expect(result).toBeNull();
  });
});