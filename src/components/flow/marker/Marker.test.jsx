import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Marker from "./Marker";
describe("Marker", () => {
  const baseProps = { type: "arrow" };
  it("renders svg, defs and marker with given id", () => {
    const { container } = render(<Marker {...baseProps} />);
    const svg = container.querySelector("svg.react-flow__marker");
    expect(svg).toBeTruthy();
    expect(svg.style.position).toBe("absolute");
    expect(svg.style.width).toBe("0px");
    expect(svg.style.height).toBe("0px");
    const defs = container.querySelector("defs");
    expect(defs).toBeTruthy();
    const marker = container.querySelector("marker");
    expect(marker).toBeTruthy();
    expect(marker.getAttribute("id")).toBe("arrow");
    expect(marker.getAttribute("markerWidth")).toBe("5");
    expect(marker.getAttribute("markerHeight")).toBe("5");
    expect(marker.getAttribute("viewBox")).toBe("-10 -10 20 20");
    expect(marker.getAttribute("markerUnits")).toBe("strokeWidth");
    expect(marker.getAttribute("orient")).toBe("auto-start-reverse");
    expect(marker.getAttribute("refX")).toBe("-3");
    expect(marker.getAttribute("refY")).toBe("0");
  });
  it("renders polyline when type is not flowingPipe or flowingPipeDotted", () => {
    const { container } = render(<Marker type="customType" />);
    const polyline = container.querySelector("polyline");
    expect(polyline).toBeTruthy();
    expect(polyline.getAttribute("points")).toBe("-8,-6 0,0 -8,6 -8,-9");
    // style object applied
    expect(polyline.style.strokeWidth).toBe("1.5");
    expect(polyline.style.strokeLinecap).toBe("round");
    expect(polyline.style.strokeLinejoin).toBe("round");
  });
  it('hides polyline when type is "flowingPipe"', () => {
    const { container } = render(<Marker type="flowingPipe" />);
    const polyline = container.querySelector("polyline");
    expect(polyline).toBeNull();
  });
  it('hides polyline when type is "flowingPipeDotted"', () => {
    const { container } = render(<Marker type="flowingPipeDotted" />);
    const polyline = container.querySelector("polyline");
    expect(polyline).toBeNull();
  });
});