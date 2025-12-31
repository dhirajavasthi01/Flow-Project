import { atom } from "jotai";
export const AppAtom = atom({
    actualTime: null,
    actualTimeStr: null,
    caseData: [],
    caseHierarchy: null,
    calenderData: null,
    quickLinks: [],
    timeActualByCaseIds: {}
});
export const actualTimeLoadingAtom = atom(true)
export const ModelSkipAtom = atom({ modelSkipStatus: false })
 