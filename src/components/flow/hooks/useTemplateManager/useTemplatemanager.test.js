import { act, renderHook } from "@testing-library/react";
import { useTemplateManager } from "./useTemplateManager";

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "unique-id"),
}));

vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtom: jest.fn(),
  };
});

import { useAtom } from "jotai";

describe("useTemplateManager", () => {
  let templates;
  let setTemplates;

  beforeEach(() => {
    templates = [];
    setTemplates = jest.fn((updater) => {
      if (typeof updater === "function") {
        templates = updater(templates);
      } else {
        templates = updater;
      }
    });

    useAtom.mockReturnValue([templates, setTemplates]);
  });

  it("should save a new template successfully", () => {
    const { result } = renderHook(() => useTemplateManager());
    const nodes = [{ id: 1 }];
    const edges = [{ id: "e1" }];
    let newTemplate;

    act(() => {
      newTemplate = result.current.saveTemplate("Test Template", nodes, edges);
    });

    expect(newTemplate).toMatchObject({
      name: "Test Template",
      nodes,
      edges,
    });

    expect(setTemplates).toHaveBeenCalledTimes(1);
    expect(templates.length).toBe(1);
    expect(templates[0].name).toBe("Test Template");
  });

  it("should throw error when saving template without name or nodes", () => {
    const { result } = renderHook(() => useTemplateManager());
    const nodes = [{ id: 1 }];

    expect(() => {
      act(() => {
        result.current.saveTemplate("", nodes, []);
      });
    }).toThrow("Template name and at least one node are required");

    expect(() => {
      act(() => {
        result.current.saveTemplate("Name", [], []);
      });
    }).toThrow("Template name and at least one node are required");
  });

  it("should throw error when saving template with duplicate name", () => {
    templates = [{ id: "1", name: "Duplicate", nodes: [], edges: [] }];

    setTemplates = jest.fn((updater) => {
      if (typeof updater === "function") {
        templates = updater(templates);
      } else {
        templates = updater;
      }
    });

    useAtom.mockReturnValue([templates, setTemplates]);

    const { result } = renderHook(() => useTemplateManager());

    expect(() => {
      act(() => {
        result.current.saveTemplate("Duplicate", [{ id: 1 }], []);
      });
    }).toThrow('Template with name "Duplicate" already exists');
  });

  it("should delete a template successfully", () => {
    templates = [{ id: "1", name: "ToDelete", nodes: [], edges: [] }];

    setTemplates = jest.fn((updater) => {
      if (typeof updater === "function") {
        templates = updater(templates);
      } else {
        templates = updater;
      }
    });

    useAtom.mockReturnValue([templates, setTemplates]);

    const { result } = renderHook(() => useTemplateManager());

    act(() => {
      result.current.deleteTemplate("1");
    });

    expect(setTemplates).toHaveBeenCalledTimes(1);

    expect(templates.find((t) => t.id === "1")).toBeUndefined();
  });

  it("should get a template by id", () => {
    templates = [{ id: "1", name: "GetMe", nodes: [], edges: [] }];

    useAtom.mockReturnValue([templates, setTemplates]);

    const { result } = renderHook(() => useTemplateManager());

    const template = result.current.getTemplate("1");

    expect(template).toEqual(templates[0]);

    const notFound = result.current.getTemplate("non-existing-id");

    expect(notFound).toBeNull();
  });

  it("should rename a template", () => {
    templates = [{ id: "1", name: "OldName", nodes: [], edges: [] }];

    setTemplates = jest.fn((updater) => {
      if (typeof updater === "function") {
        templates = updater(templates);
      } else {
        templates = updater;
      }
    });

    useAtom.mockReturnValue([templates, setTemplates]);

    const { result } = renderHook(() => useTemplateManager());

    act(() => {
      result.current.renameTemplate("1", "NewName");
    });

    expect(setTemplates).toHaveBeenCalledTimes(1);

    expect(templates[0].name).toBe("NewName");
  });

  it("should throw error when renaming template with empty name", () => {
    const { result } = renderHook(() => useTemplateManager());

    expect(() => {
      act(() => {
        result.current.renameTemplate("1", "    ");
      });
    }).toThrow("Template name cannot be empty");
  });

  it("should duplicate a template", () => {
    templates = [
      {
        id: "1",
        name: "Original",
        nodes: [{ id: "n1" }],
        edges: [{ id: "e1" }],
      },
    ];

    setTemplates = jest.fn((updater) => {
      if (typeof updater === "function") {
        templates = updater(templates);
      } else {
        templates = updater;
      }
    });

    useAtom.mockReturnValue([templates, setTemplates]);

    const { result } = renderHook(() => useTemplateManager());

    let duplicatedTemp;

    act(() => {
      duplicatedTemp = result.current.duplicateTemplate("1", "Copy Name");
    });

    expect(setTemplates).toHaveBeenCalledTimes(1);

    expect(templates.length).toBe(2);

    expect(duplicatedTemp.name).toBe("Copy Name");

    expect(duplicatedTemp.id).not.toBe("1");

    expect(duplicatedTemp.nodes).toEqual([{ id: "n1" }]);
  });

  it("should throw error if duplicating a non-existent template", () => {
    const { result } = renderHook(() => useTemplateManager());

    expect(() => {
      act(() => {
        result.current.duplicateTemplate("non-existent", "New Name");
      });
    }).toThrow("Template not found");
  });
});
