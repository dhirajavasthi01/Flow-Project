import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModeControls from "./ModeControls";

/* ------------------------------------------------------------------
Mock Panel from @xyflow/react
------------------------------------------------------------------- */
vi.mock("@xyflow/react", () => ({
  Panel: ({ children, position, className }) => (
    <div
      data-testid={`panel-${position}`}
      data-position={position}
      className={className}
    >
      {children}
    </div>
  ),
}));

/* ------------------------------------------------------------------
Tests
------------------------------------------------------------------- */
describe("ModeControls", () => {
  let toggle;
  let setPartial;
  let handleSaveClick;
  let handleSaveTemplate;

  beforeEach(() => {
    toggle = vi.fn();
    setPartial = vi.fn();
    handleSaveClick = vi.fn();
    handleSaveTemplate = vi.fn();
  });

  const renderComponent = (props = {}) =>
    render(
      <ModeControls
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
        {...props}
      />
    );

  it("does not render when developer mode is disabled", () => {
    render(
      <ModeControls
        showDeveloperMode={false}
        isDeveloperMode={true}
      />
    );

    expect(screen.queryByTestId("panel-top-left")).not.toBeInTheDocument();
  });

  it("renders panels when developer mode is enabled", () => {
    renderComponent();

    expect(screen.getByTestId("panel-top-left")).toBeInTheDocument();
    expect(screen.getByTestId("panel-top-right")).toBeInTheDocument();
  });

  it("toggles partial selection checkbox", () => {
    renderComponent({ partial: false });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(setPartial).toHaveBeenCalled();
  });

  it("renders 'Show Handles' when show is false", () => {
    renderComponent({ show: false });

    expect(screen.getByText("Show Handles")).toBeInTheDocument();
  });

  it("renders 'Hide Handles' when show is true", () => {
    renderComponent({ show: true });

    expect(screen.getByText("Hide Handles")).toBeInTheDocument();
  });

  it("calls toggle when handles button is clicked", () => {
    renderComponent({ show: false });

    fireEvent.click(screen.getByTestId("handles-button"));

    expect(toggle).toHaveBeenCalledWith(true);
  });

  it("calls handleSaveClick when save button is clicked", () => {
    renderComponent();

    fireEvent.click(screen.getByTestId("save-button"));

    expect(handleSaveClick).toHaveBeenCalled();
  });

  it("shows 'Saving...' when isAdding is true", () => {
    renderComponent({ isAdding: true });

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("renders save template button with correct node/edge counts", () => {
    renderComponent({
      showSaveTemplate: true,
      selNodes: [{ id: 1 }, { id: 2 }],
      selEdges: [{ id: "e1" }],
    });

    expect(
      screen.getByText(/Save as Template \(2 nodes, 1 edge\)/i)
    ).toBeInTheDocument();
  });

  it("calls handleSaveTemplate when save template button is clicked", () => {
    renderComponent({
      showSaveTemplate: true,
      selNodes: [{ id: 1 }],
      selEdges: [],
    });

    fireEvent.click(screen.getByTestId("save-template-button"));

    expect(handleSaveTemplate).toHaveBeenCalled();
  });
});
 