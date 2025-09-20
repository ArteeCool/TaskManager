import { getCurrentUser } from "@/features/auth/api/getUser";
import { AuthContext } from "@/features/auth/model/context";
import type { User } from "@/features/auth/model/types";
import { useLoader } from "@/features/loader/lib/useLoader";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { queryClient } from "../QueryProvider/query/queryClient";

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
    const { startLoading, finishLoading } = useLoader();

    const {
        data,
        isLoading: isQueryLoading,
        isError,
        refetch,
    } = useQuery<User>({
        queryKey: ["user"],
        queryFn: getCurrentUser,
        retry: false,
        refetchOnWindowFocus: true,
        refetchOnReconnect: false,
    });

    const handleRefetch = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleLogOut = useCallback(() => {
        queryClient.setQueryData<User | null>(["user"], null);
    }, []);

    useEffect(() => {
        if (isQueryLoading) {
            startLoading("auth");
        } else {
            finishLoading("auth");
        }

        document.addEventListener("profileUpdated", handleRefetch);
        document.addEventListener("authorizated", handleRefetch);
        document.addEventListener("logout", handleLogOut);

        return () => {
            document.removeEventListener("profileUpdated", handleRefetch);
            document.removeEventListener("authorizated", handleRefetch);
            document.removeEventListener("logout", handleLogOut);
        };
    }, [
        isQueryLoading,
        startLoading,
        finishLoading,
        handleRefetch,
        handleLogOut,
    ]);

    useEffect(() => {
        if (isError) {
            console.warn("User is not authenticated.");
        }
    }, [isError]);

    return (
        <AuthContext.Provider value={{ user: data ?? null }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
