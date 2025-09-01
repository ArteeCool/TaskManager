import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const usePublicProfile = (id: number) => {
    return useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const result = await axios.get(
                `http://localhost:5678/api/profile/get-public/${id}`
            );
            return result.data;
        },
    });
};
