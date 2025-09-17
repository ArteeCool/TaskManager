import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ListWithTasks } from "../model/types";

export const useGetTasksFromBoard = (boardId: number) => {
    return useQuery<ListWithTasks[]>({
        queryKey: ["tasks", boardId],
        queryFn: async () => {
            try {
                const response = await axios.get<ListWithTasks[]>(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/lists/get/${boardId}`,
                    { withCredentials: true }
                );
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw error;
                }
                throw new Error("Get tasks failed");
            }
        },
    });
};
