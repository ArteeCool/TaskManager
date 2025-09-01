import { LoaderContext } from "@/features/loader/model/context";
import type { Loaders } from "@/features/loader/model/types";
import { useCallback, useState, useMemo } from "react";

interface LoaderProviderProps {
    children: React.ReactNode;
}

const LoaderProvider = ({ children }: LoaderProviderProps) => {
    const [loadings, setLoadings] = useState(
        new Set<Loaders>(["auth", "fonts"])
    );

    const startLoading = useCallback(
        (name: Loaders) => setLoadings((prev) => new Set(prev).add(name)),
        []
    );

    const finishLoading = useCallback(
        (name: Loaders) =>
            setLoadings((prev) => {
                const next = new Set(prev);
                next.delete(name);
                return next;
            }),
        []
    );

    const contextValue = useMemo(
        () => ({ loadings, startLoading, finishLoading }),
        [loadings, startLoading, finishLoading]
    );

    return (
        <LoaderContext.Provider value={contextValue}>
            {children}
        </LoaderContext.Provider>
    );
};

export default LoaderProvider;
