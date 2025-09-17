import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useRequestResetPassword = () => {
    return useMutation({
        mutationKey: ["request-reset-password"],
        mutationFn: async (email: string) => {
            try {
                const result = await axios.post(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/auth/forgot-password`,
                    { email }
                );

                return result.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw error;
                }
                throw new Error("Request reset password failed");
            }
        },
    });
};
