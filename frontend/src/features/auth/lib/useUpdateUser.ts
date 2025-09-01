import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export const useUpdateUser = () => {
    return useMutation({
        mutationFn: async (data: FormData) => {
            const response = await axios.put(
                "https://localhost:5678/api/profile/update",
                data,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            return response.data;
        },
    });
};
