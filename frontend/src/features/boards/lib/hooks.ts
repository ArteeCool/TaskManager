// hooks.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ListWithTasks, Task, TaskRequest } from "../model/types";

// Create a reusable axios instance with default config
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

// Generic error handler
const handleApiError = (error: unknown, defaultMessage: string) => {
    if (axios.isAxiosError(error)) {
        throw new Error(
            error.response?.data?.message || error.message || defaultMessage
        );
    }
    throw new Error(defaultMessage);
};

export const useCreateList = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { board_id: number; title: string }) => {
            try {
                const response = await apiClient.post(
                    "/api/lists/create",
                    data
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to create list");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
};

export const useUpdateList = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (list: Partial<ListWithTasks> & { id: number }) => {
            try {
                const response = await apiClient.put(
                    `/api/lists/update/${list.id}`,
                    list
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to update list");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
};

export const useDeleteList = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (listId: number) => {
            try {
                const response = await apiClient.delete(
                    `/api/lists/delete/${listId}`
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to delete list");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<Task, "id"> & { list_id: number }) => {
            try {
                const response = await apiClient.post(
                    "/api/tasks/create",
                    data
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to create task");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<TaskRequest>) => {
            try {
                const response = await apiClient.put(
                    `/api/tasks/update/${data.id}`,
                    data
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to update task");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
};

export const useBatchUpdateTasks = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tasks: Array<Partial<Task> & { id: number }>) => {
            try {
                const response = await apiClient.put(
                    "/api/tasks/batch-update",
                    { tasks }
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to update tasks");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (taskId: number) => {
            try {
                const response = await apiClient.delete(
                    `/api/tasks/delete/${taskId}`
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to delete task");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
};
