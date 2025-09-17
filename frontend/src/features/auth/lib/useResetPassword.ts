import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useResetPassword = () => {
    return useMutation({
        mutationFn: async ({
            token,
            password,
        }: {
            token: string;
            password: string;
        }) => {
            try {
                const response = await axios.post(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/auth/reset-password/${token}`,
                    { password }
                );

                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw error;
                }
                throw new Error("Reset password failed");
            }
        },
    });
};
