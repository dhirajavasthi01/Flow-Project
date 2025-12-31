import { atom } from 'jotai'
import DefaultLoader from '../../../assets/flowIcons/Box.svg'
import { DEFAULT_TIMEZONE } from '../../../config/Constants'
export const AuthStateAtom = atom(null)
export const TimezoneAtom = atom(DEFAULT_TIMEZONE)
export const FavoritesAtom = atom(null)
export const CaseDataAtom = atom(null)
export const LoaderAtom = atom(DefaultLoader);
export const RootDatePickerLoaderAtom = atom(false);
export const AccessRedirectPointAtom = atom({
    affiliate: null,
    plant: null,
})
export const ToastAtom = atom({
    open: false,
    message: "",
    severity: "info",
    duration: 3000
})
export const ConfirmModalAtom = atom({
    open: false,
    message: "",
    title: "",
    resolve: null,
})
export const CaseHierarchyQueryDataAtom = atom({})
export const IndividualWrapperStore = atom(null)