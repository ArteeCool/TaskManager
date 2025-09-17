import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { BoardRequest } from "../model/types";

export const useCreateBoard = () => {
    return useMutation({
        mutationKey: ["create-board"],
        mutationFn: async (data: BoardRequest) => {
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL || ""}/api/boards/create`,
                    data,
                    { withCredentials: true }
                );
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw error;
                }
                throw new Error("Create board failed");
            }
        },
    });
};
