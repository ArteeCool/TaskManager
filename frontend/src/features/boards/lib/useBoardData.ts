import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { BoardWithListsResponse } from "../model/types";

export const useGetBoardData = (boardId: number) => {
    return useQuery<BoardWithListsResponse>({
        queryKey: ["tasks", boardId],
        queryFn: async () => {
            try {
                const response = await axios.get<BoardWithListsResponse>(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/boards/get/${boardId}`,
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
