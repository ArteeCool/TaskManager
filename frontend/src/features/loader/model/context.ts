import { createContext } from "react";
import type { Loaders } from "./types";

interface LoaderContextType {
    loadings: Set<Loaders>;
    startLoading: (name: Loaders) => void;
    finishLoading: (name: Loaders) => void;
}

export const LoaderContext = createContext<LoaderContextType>({
    loadings: new Set(),
    startLoading: () => false,
    finishLoading: () => {},
});
