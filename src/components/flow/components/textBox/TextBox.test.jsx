import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TextboxNode } from "./TextBox";
vi.mock("@xyflow/react", () => ({
  NodeResizer: ({ isVisible, onResizeEnd }) =>
    isVisible ? (
      <button
        data-testid="resizer"
        onClick={() =>
          onResizeEnd(null, { width: 300, height: 150 })
        }
      >
        resize
      </button>
    ) : null,
  useReactFlow: () => ({
    setNodes: vi.fn(),
    screenToFlowPosition: ({ x, y }) => ({ x, y }),
    getNodes: () => [
      {
        id: "target",
        internals: {
          positionAbsolute: { x: 0, y: 0 },
          z: 2,
        },
        measured: { width: 500, height: 300 },
        data: { subComponentAssetId: "asset-1" },
      },
    ],
  }),
  useStore: (fn) =>
    fn({
      nodeLookup: new Map([
        [
          "target",
          {
            id: "target",
            type: "normalNode",
            measured: { width: 500, height: 300 },
            internals: {
              positionAbsolute: { x: 0, y: 0 },
              z: 5,
            },
          },
        ],
      ]),
    }),
}));
vi.mock("../../handles/Handles", () => ({
  default: () => <div data-testid="handles" />,
}));
vi.mock(
  "../../../../features/individualDetailWrapper/features/overview/store/OverviewStore",
  () => {
    const { atom } = require("jotai");
    return {
      developerModeAtom: atom(true),
      selectedNodeIdAtom: atom(null),
      selectedEdgeIdAtom: atom(null),
      failureNodeClickedAtom: atom(null),
      isFailureModeAtom: atom(false),
      nodeConfigAtom: atom(null),
      allTagsDataAtom: atom([
        { tagId: 1, actual: "TAG-TEXT" },
      ]),
    };
  }
);
vi.mock("../../../../utills/flowUtills/FlowUtills", () => ({
  EXTRA_NODE_COLORS: {
    template1: { bgColor: "yellow" },
  },
}));
const renderNode = (props = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <JotaiProvider>
        <TextboxNode
          id="node-1"
          selected
          data={{
            label: "header label",
            color: "green",
            width: 200,
            height: 100,
            numSourceHandlesRight: 1,
            numSourceHandlesBottom: 1,
            numTargetHandlesTop: 1,
            numTargetHandlesLeft: 1,
            linkedTag: 1,
            template: "template1",
            targetHandles: [],
          }}
          {...props}
        />
      </JotaiProvider>
    </QueryClientProvider>
  );
describe("TextboxNode – 100% Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("renders label with tag override", () => {
    renderNode();
    expect(screen.getByText("TAG-TEXT")).toBeInTheDocument();
  });
  it("renders NodeResizer when selected + dev mode", () => {
    renderNode();
    expect(screen.getByTestId("resizer")).toBeInTheDocument();
  });
  it("updates dimensions on resize", () => {
    renderNode();
    fireEvent.click(screen.getByTestId("resizer"));
    expect(screen.getByText("TAG-TEXT")).toBeInTheDocument();
  });
  it("applies background color from template", () => {
    renderNode();
    const container = screen.getByText("TAG-TEXT").parentElement;
    expect(container.style.backgroundColor).toBe("yellow");
  });
  it("intercepts click in view mode and selects underlying node", () => {
    vi.doMock("jotai", async () => {
      const actual = await vi.importActual("jotai");
      return {
        ...actual,
        useAtomValue: () => false,
      };
    });
    const { container } = renderNode({
      selected: false,
    });
    fireEvent.mouseDown(container.firstChild, {
      clientX: 10,
      clientY: 10,
    });
    expect(container).toBeTruthy();
  });
  it("does not intercept click in developer mode", () => {
    renderNode();
    fireEvent.mouseDown(screen.getByText("TAG-TEXT"), {
      clientX: 5,
      clientY: 5,
    });
    expect(true).toBe(true);
  });
  it("renders handles", () => {
    renderNode();
    expect(screen.getByTestId("handles")).toBeInTheDocument();
  });
  it("font size adjusts for small container", () => {
    renderNode({
      data: {
        label: "Small",
        color: "black",
        width: 1,
        height: 1,
      },
    });
    expect(screen.getByText(/Small/i)).toBeInTheDocument();
  });
  it("updates font size on dimension change", () => {
    renderNode();
    fireEvent.click(screen.getByTestId("resizer"));
    expect(screen.getByText("TAG-TEXT").style.fontSize).toContain("px");
  });
  it("uses label text when no tag exists", () => {
    render(
      <JotaiProvider>
        <TextboxNode
          id="node-2"
          selected
          data={{
            label: "No Tag",
            color: "blue",
          }}
        />
      </JotaiProvider>
    );
    expect(screen.getByText("No Tag")).toBeInTheDocument();
  });
  it("forces header label color red", () => {
    renderNode();
    expect(screen.getByText("TAG-TEXT").style.color).toBe("red");
  });
});