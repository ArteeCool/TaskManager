// ProtectedRoute.tsx
import { useContext, useEffect } from "react";
import { useNavigate, Outlet } from "react-router";
import { AuthContext } from "@/features/auth/model/context";
import { useQuery } from "@tanstack/react-query";
import { useLoader } from "@/features/loader/lib/useLoader";
import { getCurrentUser } from "@/features/auth/api/getUser";

const ProtectedRoute = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { startLoading, finishLoading } = useLoader();

    const { isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: getCurrentUser,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    useEffect(() => {
        if (isLoading) {
            startLoading("auth");
        } else {
            finishLoading("auth");
        }
    }, [isLoading, startLoading, finishLoading]);

    useEffect(() => {
        if (!isLoading && !user) {
            navigate("/login", { replace: true });
        }
    }, [isLoading, user, navigate]);

    if (isLoading || !user) return null;

    return <Outlet />;
};

export default ProtectedRoute;
