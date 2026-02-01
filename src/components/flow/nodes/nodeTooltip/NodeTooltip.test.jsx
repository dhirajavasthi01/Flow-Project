import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  NodeTooltip,
  NodeTooltipTrigger,
  NodeTooltipContent,
  useNodeTooltip,
} from "./NodeTooltip";
vi.mock("@xyflow/react", () => {
  return {
    NodeToolbar: vi.fn(({ isVisible, className, children, position, tabIndex, ...rest }) => (
<div
        data-testid="node-toolbar"
        data-visible={isVisible ? "true" : "false"}
        className={className}
        position={position}
        tabindex={tabIndex}
        {...rest}
>
        {children}
</div>
    )),
  };
});
describe("useNodeTooltip", () => {
  it("returns null when used outside provider", () => {
    const TestComp = () => {
      const ctx = useNodeTooltip();
      return <div data-testid="ctx">{ctx === null ? "null" : "not-null"}</div>;
    };
    render(<TestComp />);
    expect(screen.getByTestId("ctx").textContent).toBe("null");
  });
  it("returns context when used inside NodeTooltip", () => {
    const TestComp = () => {
      const ctx = useNodeTooltip();
      return (
<div data-testid="ctx">
          {ctx && typeof ctx.showTooltip === "function" ? "has-context" : "no"}
</div>
      );
    };
    render(
<NodeTooltip>
<TestComp />
</NodeTooltip>
    );
    expect(screen.getByTestId("ctx").textContent).toBe("has-context");
  });
});
describe("NodeTooltip", () => {
  it("provides context and wraps children in styled container", () => {
    render(
<NodeTooltip>
<div data-testid="child">Child</div>
</NodeTooltip>
    );
    const child = screen.getByTestId("child");
    const container = child.parentElement;
    expect(container).toHaveStyle({
      display: "flex",
      flexDirection: "column",
    });
  });
});
describe("NodeTooltipTrigger", () => {
  it("throws when used outside NodeTooltip provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<NodeTooltipTrigger id="1" />)).toThrow(
      "NodeTooltipTrigger must be used within NodeTooltip"
    );
    spy.mockRestore();
  });
  it("triggers visibility on hover when IDs match", () => {
    const testId = "test-node-123";
    render(
<NodeTooltip>
<NodeTooltipTrigger id={testId} data-testid="trigger">
          Hover Me
</NodeTooltipTrigger>
<NodeTooltipContent id={testId}>
          Tooltip Content
</NodeTooltipContent>
</NodeTooltip>
    );
    const trigger = screen.getByTestId("trigger");
    const toolbar = screen.getByTestId("node-toolbar");
    expect(toolbar.getAttribute("data-visible")).toBe("false");
    fireEvent.mouseEnter(trigger);
    expect(toolbar.getAttribute("data-visible")).toBe("true");
    fireEvent.mouseLeave(trigger);
    expect(toolbar.getAttribute("data-visible")).toBe("false");
  });
});
describe("NodeTooltipContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("renders NodeToolbar with correct classes and props", () => {
    render(
<NodeTooltip>
<NodeTooltipContent
          id="test-id"
          position="top"
          className="extra-class"
          data-extra="value"
>
<span data-testid="tooltip-child">Tooltip Child</span>
</NodeTooltipContent>
</NodeTooltip>
    );
    const toolbar = screen.getByTestId("node-toolbar");
    expect(toolbar.className).toContain("bg-primary_gray");
    expect(toolbar.className).toContain("bg-primary_gray text-primary_white rounded-[.3vmin] z-999 extra-class");
    expect(toolbar.className).toContain("extra-class");
    expect(toolbar.getAttribute("data-extra")).toBe("value");
    expect(toolbar.getAttribute("position")).toBe("top");
    expect(screen.getByTestId("tooltip-child")).toBeInTheDocument();
  });
});