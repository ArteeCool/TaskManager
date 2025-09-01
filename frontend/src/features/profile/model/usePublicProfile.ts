import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const usePublicProfile = (id: number) => {
    return useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const result = await axios.get(
                `https://arteecool.com.ua/api/profile/get-public/${id}`
            );
            return result.data;
        },
    });
};
