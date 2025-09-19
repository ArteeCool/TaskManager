import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useConfirmEmail = (confirmationKey: string | null) => {
    return useQuery({
        queryKey: ["confirm-email"],
        queryFn: async () => {
            const result = await axios.get(
                `${
                    import.meta.env.VITE_API_URL || ""
                }/api/auth/confirm-email?key=${confirmationKey}`
            );
            return result.data;
        },
    });
};
