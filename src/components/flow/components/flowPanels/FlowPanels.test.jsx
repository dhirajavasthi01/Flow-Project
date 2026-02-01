import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FlowPanels from "./FlowPanels";

/* ------------------------------------------------------------------
Mock child components
------------------------------------------------------------------- */
vi.mock("../components/ModeControls/ModeControls", () => ({
  default: (props) => (
    <div data-testid="mode-controls">
      ModeControls
      <span data-props={JSON.stringify(props)} />
    </div>
  ),
}));

vi.mock("../components/legendPanel/LegendPanel", () => ({
  default: (props) => (
    <div data-testid="legend-panel">
      LegendPanel
      <span data-props={JSON.stringify(props)} />
    </div>
  ),
}));

/* ------------------------------------------------------------------
Tests
------------------------------------------------------------------- */
describe("FlowPanels", () => {
  let setPartial;
  let toggle;
  let handleSaveClick;
  let handleSaveTemplate;
  let setShowDrawer;

  beforeEach(() => {
    setPartial = vi.fn();
    toggle = vi.fn();
    handleSaveClick = vi.fn();
    handleSaveTemplate = vi.fn();
    setShowDrawer = vi.fn();
  });

  const renderComponent = (props = {}) =>
    render(
      <FlowPanels
        showDeveloperMode={true}
        isDeveloperMode={true}
        partial={false}
        setPartial={setPartial}
        show={false}
        toggle={toggle}
        handleSaveClick={handleSaveClick}
        isAdding={false}
        showSaveTemplate={false}
        handleSaveTemplate={handleSaveTemplate}
        selNodes={[]}
        selEdges={[]}
        legendPosition="bottom-right"
        showDrawer={false}
        setShowDrawer={setShowDrawer}
        {...props}
      />
    );

  it("does NOT render ModeControls when isFullView is true", () => {
    renderComponent({ isFullView: true });

    expect(screen.queryByTestId("mode-controls")).not.toBeInTheDocument();
  });
});
 