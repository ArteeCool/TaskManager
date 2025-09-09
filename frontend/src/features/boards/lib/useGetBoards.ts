import { useQuery } from "@tanstack/react-query";
import type { BoardResponse } from "../model/types";
import axios from "axios";

export const useGetBoards = () => {
    return useQuery<BoardResponse[]>({
        queryKey: ["boards"],
        queryFn: async () => {
            try {
                const result = await axios.get<BoardResponse[]>(
                    `${import.meta.env.VITE_API_URL || ""}/api/boards/get`,
                    { withCredentials: true }
                );
                return result.data;
            } catch (err) {
                console.error("Failed to fetch boards:", err);
                throw err;
            }
        },
        retry: false,
    });
};
