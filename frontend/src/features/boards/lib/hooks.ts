// hooks.ts
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { ListRequest, Task, TaskRequest } from "../model/types";
import { queryClient } from "@/app/providers/QueryProvider/query/queryClient";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

const handleApiError = (error: unknown, defaultMessage: string) => {
    if (axios.isAxiosError(error)) {
        throw new Error(
            error.response?.data?.message || error.message || defaultMessage
        );
    }
    throw new Error(defaultMessage);
};

export const useCreateList = () => {
    return useMutation({
        mutationFn: async (data: { board_id: number; title: string }) => {
            try {
                const response = await apiClient.post(
                    `${import.meta.env.VITE_API_URL || ""}/api/lists/create`,
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
    return useMutation({
        mutationFn: async (list: Partial<ListRequest>) => {
            try {
                const response = await apiClient.put(
                    `${import.meta.env.VITE_API_URL || ""}/api/lists/update/${
                        list.id
                    }`,
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
    return useMutation({
        mutationFn: async (listId: number) => {
            try {
                const response = await apiClient.delete(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/lists/delete/${listId}`
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
    return useMutation({
        mutationFn: async (data: Omit<Task, "id"> & { list_id: number }) => {
            try {
                const response = await apiClient.post(
                    `${import.meta.env.VITE_API_URL || ""}/api/tasks/create`,
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
    return useMutation({
        mutationFn: async (data: Partial<TaskRequest>) => {
            try {
                const response = await apiClient.put(
                    `${import.meta.env.VITE_API_URL || ""}/api/tasks/update/${
                        data.id
                    }`,
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
    return useMutation({
        mutationFn: async (
            tasks: (Partial<TaskRequest> & { id: number })[]
        ) => {
            try {
                const response = await apiClient.put(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/tasks/batch-update`,
                    tasks
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
    return useMutation({
        mutationFn: async (taskId: number) => {
            try {
                const response = await apiClient.delete(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/tasks/delete/${taskId}`
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

export const useCreateComment = () => {
    return useMutation({
        mutationFn: async (data: { taskId: number; content: string }) => {
            try {
                const response = await apiClient.post(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/tasks/comments/create`,
                    data,
                    { withCredentials: true }
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to create comment");
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["comments", variables.taskId],
            });
        },
    });
};

export const useUpdateComment = () => {
    return useMutation({
        mutationFn: async (data: { commentId: number; content: string }) => {
            try {
                const response = await apiClient.put(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/tasks/comments/update/${data.commentId}`,
                    data,
                    { withCredentials: true }
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to update comment");
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["comments"] });
            queryClient.invalidateQueries({
                queryKey: ["comment", variables.commentId],
            });
        },
    });
};

export const useDeleteComment = () => {
    return useMutation({
        mutationFn: async (commentId: number) => {
            try {
                const response = await apiClient.delete(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/tasks/comments/delete/${commentId}`,
                    { withCredentials: true }
                );
                return response.data;
            } catch (error) {
                handleApiError(error, "Failed to delete comment");
            }
        },
        onSuccess: (_, commentId) => {
            queryClient.invalidateQueries({ queryKey: ["comments"] });
            queryClient.invalidateQueries({ queryKey: ["comment", commentId] });
        },
    });
};
