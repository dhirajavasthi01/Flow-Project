import { nanoid } from 'nanoid';

import { templatesStateAtom } from '../../../../features/individualDetailWrapper/store/OverviewStore';

import { useAtom } from 'jotai';

 

export const useTemplateManager = () => {

  const [templates, setTemplates] = useAtom(templatesStateAtom);

  const saveTemplate = (name, nodes, edges) => {

    if (!name || !nodes || nodes.length === 0) {

      throw new Error('Template name and at least one node are required');

    }

 

    // Deep clone nodes/edges to decouple future mutations

    const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

    const safeNodes = deepClone(nodes);

    const safeEdges = deepClone(edges || []);

 

    const template = {

      id: nanoid(),

      name: name.trim(),

      nodes: safeNodes,

      edges: safeEdges,

      createdAt: new Date().toISOString()

    };

 

    setTemplates(prevTemplates => {

      // Check if template name already exists

      const existingTemplate = prevTemplates.find(t => t.name === template.name);

      if (existingTemplate) {

        throw new Error(`Template with name "${template.name}" already exists`);

      }

     

      return [...prevTemplates, template];

    });

 

    return template;

  };

 

  const deleteTemplate = (templateId) => {

    setTemplates(prevTemplates =>

      prevTemplates.filter(template => template.id !== templateId)

    );

  };

 

  const getTemplate = (templateId) => {

    return templates.find(template => template.id === templateId) || null;

  };

 

  const renameTemplate = (templateId, newName) => {

    if (!newName || !newName.trim()) {

      throw new Error('Template name cannot be empty');

    }

 

    setTemplates(prevTemplates =>

      prevTemplates.map(template =>

        template.id === templateId

          ? { ...template, name: newName.trim() }

          : template

      )

    );

  };

 

  const duplicateTemplate = (templateId, newName) => {

    const originalTemplate = getTemplate(templateId);

    if (!originalTemplate) {

      throw new Error('Template not found');

    }

 

    const duplicatedTemplate = {

      ...originalTemplate,

      id: nanoid(),

      name: newName || `${originalTemplate.name} (Copy)`,

      createdAt: new Date().toISOString()

    };

 

    setTemplates(prevTemplates => [...prevTemplates, duplicatedTemplate]);

    return duplicatedTemplate;

  };

 

  return {

    templates,

    saveTemplate,

    deleteTemplate,

    getTemplate,

    renameTemplate,

    duplicateTemplate

  };

};

 