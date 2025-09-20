import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useLoader } from "@/features/loader/lib/useLoader";
import { useAcceptInvite } from "@/features/boards/lib/useAcceptInvite";

const InviteConfirmation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { startLoading, finishLoading } = useLoader();

    const token = searchParams.get("token");

    const { data, isLoading, error } = useAcceptInvite(token);

    useEffect(() => {
        if (isLoading) {
            startLoading("auth");
            return;
        }
        finishLoading("auth");

        if (error) {
            toast.error("Invitation could not be accepted.");
            return;
        }

        if (data) {
            console.log(data);
            toast.success("Invitation accepted! You are now on the board.");
            navigate(`/board/${data.boardId}`);
        }
    }, [data, error, isLoading, navigate, startLoading, finishLoading]);

    return <div className="flex-1"></div>;
};

export default InviteConfirmation;
