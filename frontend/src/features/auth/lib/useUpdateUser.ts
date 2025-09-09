import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useUpdateUser = () => {
    return useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL || ""}/api/profile/update`,
                data,
                {
                    withCredentials: true,
                }
            );
            return response.data;
        },
    });
};
