import { atom } from 'jotai'

 

export const subSystemListAtom = atom([
    {
      "entityID": 1,
      "entityName": "Cracked Gas Compressor",
      "entityDisplayName": "Cracked Gas Compressor",
      "entityType": "entity",
      "parentEntityID": null
    },
    {
      "entityID": 2,
      "entityName": "LP DGS",
      "entityDisplayName": "LP DGS",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 3,
      "entityName": "MP DGS",
      "entityDisplayName": "MP DGS",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 4,
      "entityName": "HP DGS",
      "entityDisplayName": "HP DGS",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 5,
      "entityName": "Process Stg1",
      "entityDisplayName": "Process Stg1",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 6,
      "entityName": "Process Stg2",
      "entityDisplayName": "Process Stg2",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 7,
      "entityName": "Process Stg3",
      "entityDisplayName": "Process Stg3",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 8,
      "entityName": "Process Stg4&5",
      "entityDisplayName": "Process Stg4&5",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 9,
      "entityName": "Oil System",
      "entityDisplayName": "Oil System",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 10,
      "entityName": "LP Mechanical",
      "entityDisplayName": "LP Mechanical",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 11,
      "entityName": "MP Mechanical",
      "entityDisplayName": "MP Mechanical",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 12,
      "entityName": "HP Mechanical",
      "entityDisplayName": "HP Mechanical",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 13,
      "entityName": "Turbine KT13001",
      "entityDisplayName": "Turbine KT13001",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 14,
      "entityName": "Turbine KT13002",
      "entityDisplayName": "Turbine KT13002",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 15,
      "entityName": "Surface Condenser KT13001",
      "entityDisplayName": "Surface Condenser KT13001",
      "entityType": "sub_entity",
      "parentEntityID": 1
    },
    {
      "entityID": 16,
      "entityName": "Surface Condenser KT13002",
      "entityDisplayName": "Surface Condenser KT13002",
      "entityType": "sub_entity",
      "parentEntityID": 1
    }
  ]);

 

export const atomWithToggle = (initialValue = false) => {

  const baseAtom = atom(initialValue);

  const derivedAtom = atom(

    (get) => get(baseAtom),

    (get, set) => set(baseAtom, !get(baseAtom))

  );

  return derivedAtom;

};

 

// Toggle atoms

export const showHandlesAtom = atomWithToggle(false);

export const updateConfigAtom = atomWithToggle(false);

 

export const nodeConfigAtom = atom(null);

export const selectedNodeIdAtom = atom(null);

export const selectedEdgeIdAtom = atom(null);

export const newNodeAtom = atom(null);

export const tagListAtom = atom([]);

export const selectedPageAtom = atom(null);

export const networkLockedAtom = atomWithToggle(false);

export const developerModeAtom = atomWithToggle(false);

export const isFailureModeAtom = atomWithToggle(false);

export const deleteAtom = atomWithToggle(false);

export const allTagsAtom = atom([]);

export const allTagsDataAtom = atom([])

export const newNodeTypeAtom = atom(null)

export const fitViewAtom = atom(0)

export const networkDownloadingAtom = atom({ type: 'png', isDownloading: false })

export const dragNodeTypeAtom = atom(null)

export const AppAtom = atom({})

export const highlightedNodeTypeAtom = atom(null);

export const networkFlowDataAtom = atom({

    nodes: [],

    edges: [],

    saved: false

});

// Template interface and atom for reusable node templates

export const templatesStateAtom = atom([]);

export const selectedNodeAtom = atom("")

export const selectedEdgeTypeAtom = atom('straightArrow')

 

