import {
  handleDragOver,
  handleTemplateDropHelper,
  handleSaveTemplate,
} from "./TemplateHelper.js";

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("TemplateHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ================= handleDragOver =================

  it("sets dropEffect to copy for application/template type", () => {
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: {
        types: ["application/template"],
        getData: vi.fn(),
        dropEffect: "",
      },
    };

    handleDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.dataTransfer.dropEffect).toBe("copy");
  });

  it("sets dropEffect to copy for TEMPLATE fallback", () => {
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: {
        types: [],
        getData: vi.fn(() => "TEMPLATE:abc123"),
        dropEffect: "",
      },
    };

    handleDragOver(event);

    expect(event.dataTransfer.dropEffect).toBe("copy");
  });

  it("sets dropEffect to move for non-template drag", () => {
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: {
        types: ["text/plain"],
        getData: vi.fn(() => "NORMAL_TEXT"),
        dropEffect: "",
      },
    };

    handleDragOver(event);

    expect(event.dataTransfer.dropEffect).toBe("move");
  });

  // ================= handleTemplateDropHelper =================

  it("returns false when no template data is present", () => {
    const result = handleTemplateDropHelper({
      event: {
        dataTransfer: {
          getData: vi.fn(() => ""),
        },
      },
    });

    expect(result).toBe(false);
  });

  it("handles template drop using application/template data", () => {
    const event = {
      preventDefault: vi.fn(),
      clientX: 10,
      clientY: 20,
      dataTransfer: {
        getData: vi.fn(() =>
          JSON.stringify({ templateId: "temp1" })
        ),
      },
    };

    const screenToFlowPosition = vi.fn(() => ({ x: 1, y: 2 }));
    const setTemplateDropCounts = vi.fn();
    const setNodes = vi.fn();
    const setEdges = vi.fn();

    const handleTemplateDrop = vi.fn(() => ({
      success: true,
    }));

    const result = handleTemplateDropHelper({
      event,
      screenToFlowPosition,
      handleTemplateDrop,
      templateDropCounts: {},
      setTemplateDropCounts,
      setNodes,
      setEdges,
    });

    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(handleTemplateDrop).toHaveBeenCalledWith(
      "temp1",
      { x: 1, y: 2 },
      expect.any(Function),
      expect.any(Function),
      1
    );
  });

  it("handles TEMPLATE fallback from text/plain", () => {
    const event = {
      preventDefault: vi.fn(),
      clientX: 0,
      clientY: 0,
      dataTransfer: {
        getData: vi.fn((type) =>
          type === "text/plain" ? "TEMPLATE:fallback123" : ""
        ),
      },
    };

    const handleTemplateDrop = vi.fn(() => ({ success: true }));

    const result = handleTemplateDropHelper({
      event,
      screenToFlowPosition: vi.fn(() => ({ x: 0, y: 0 })),
      handleTemplateDrop,
      templateDropCounts: {},
      setTemplateDropCounts: vi.fn(),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
    });

    expect(result).toBe(true);
    expect(handleTemplateDrop).toHaveBeenCalled();
  });

  it("handles JSON parse error gracefully", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const event = {
      preventDefault: vi.fn(),
      clientX: 0,
      clientY: 0,
      dataTransfer: {
        getData: vi.fn(() => "INVALID_JSON"),
      },
    };

    const result = handleTemplateDropHelper({
      event,
      screenToFlowPosition: vi.fn(),
      handleTemplateDrop: vi.fn(),
      templateDropCounts: {},
      setTemplateDropCounts: vi.fn(),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
    });

    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // ================= handleSaveTemplate =================

  it("alerts when no nodes are selected", () => {
    global.alert = vi.fn();

    handleSaveTemplate({
      selNodes: [],
      selEdges: [],
      saveTemplate: vi.fn(),
      setShowSaveTemplate: vi.fn(),
    });

    expect(global.alert).toHaveBeenCalled();
  });

  it("does nothing when template name is empty", () => {
    global.prompt = vi.fn(() => "   ");
    const saveTemplate = vi.fn();

    handleSaveTemplate({
      selNodes: [{ id: 1 }],
      selEdges: [],
      saveTemplate,
      setShowSaveTemplate: vi.fn(),
    });

    expect(saveTemplate).not.toHaveBeenCalled();
  });

  it("saves template successfully", () => {
    global.prompt = vi.fn(() => "My Template");
    global.alert = vi.fn();

    const saveTemplate = vi.fn();
    const setShowSaveTemplate = vi.fn();

    handleSaveTemplate({
      selNodes: [{ id: 1 }, { id: 2 }],
      selEdges: [{ id: "e1" }],
      saveTemplate,
      setShowSaveTemplate,
    });

    expect(saveTemplate).toHaveBeenCalledWith(
      "My Template",
      [{ id: 1 }, { id: 2 }],
      [{ id: "e1" }]
    );
    expect(setShowSaveTemplate).toHaveBeenCalledWith(false);
    expect(global.alert).toHaveBeenCalled();
  });

  it("alerts when saveTemplate throws error", () => {
    global.prompt = vi.fn(() => "Bad Template");
    global.alert = vi.fn();

    const saveTemplate = vi.fn(() => {
      throw new Error("Save failed");
    });

    handleSaveTemplate({
      selNodes: [{ id: 1 }],
      selEdges: [],
      saveTemplate,
      setShowSaveTemplate: vi.fn(),
    });

    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("Save failed")
    );
  });
});
 