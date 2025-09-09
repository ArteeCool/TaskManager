import { useConfirmEmail } from "@/features/email/lib/useConfirmEmail";
import { useLoader } from "@/features/loader/lib/useLoader";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

const EmailConfirmation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { startLoading, finishLoading } = useLoader();

    const confirmationKey = searchParams.get("key");

    const { data, isLoading } = useConfirmEmail(confirmationKey);

    useEffect(() => {
        if (data && !isLoading) {
            finishLoading("auth");
            toast.success("Email confirmed successfully!");
            navigate("/");
        } else {
            startLoading("auth");
        }
    }, [data, finishLoading, isLoading, navigate, startLoading]);

    return <div className="flex-1"></div>;
};

export default EmailConfirmation;
