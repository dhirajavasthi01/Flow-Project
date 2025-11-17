import { atom } from 'jotai'

 

export const subSystemListAtom = atom([

  { id: 'mp_dgs', name: 'MP DGS' },

  { id: 'lp_dgs', name: 'LP DGS' },

  { id: 'proc_s2', name: 'PROCESS STG 2' },

  { id: 'proc_s3', name: 'PROCESS STG 3' },

  { id: 'proc_s1', name: 'PROCESS STG 1' },

  { id: 'turbine1', name: 'TURBINE 1' },

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

 

