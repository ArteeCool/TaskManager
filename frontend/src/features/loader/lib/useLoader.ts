import { useContext } from "react";
import { LoaderContext } from "../model/context";

export const useLoader = () => {
    return useContext(LoaderContext);
};
