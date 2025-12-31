import { useAtom } from "jotai";
import { LoaderAtom } from "../../features/individualDetailWrapper/store/RootStore";
export default function Loader({ id }){
    const [loaderVal] = useAtom(LoaderAtom);
    return (
        <div
            role="progressbar"
            id={id}
            data-testid={id}
            className={`flex items-center text-center justify-center h-full w-full`}
        >
            <img alt="" src={loaderVal} className={`w-[5vmin] h-[5vmin] !filter-none`} />
        </div>
    );
}