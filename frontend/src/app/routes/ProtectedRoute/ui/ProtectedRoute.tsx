import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useLoader } from "@/features/loader/lib/useLoader";
import { getCurrentUser } from "@/features/auth/api/getUser";
import { toast } from "sonner";
import { useUser } from "@/features/auth/lib/useUser";

const ProtectedRoute = () => {
    const { user } = useUser();
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
            navigate("/log-in", { replace: true });
        }
    }, [isLoading, user, navigate]);

    useEffect(() => {
        if (user && user.confirmation_key) {
            toast.success("Please confirm your email.");
            navigate("/");
        }
    }, [navigate, user, user?.confirmation_key]);

    if (isLoading || !user) return null;

    return <Outlet />;
};

export default ProtectedRoute;
