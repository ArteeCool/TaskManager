import { useQuery } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";

interface UseFetchProps {
    queryKey: string[];
    url: string;
    enabled?: boolean;
    autoRetry?: boolean;
}

export function useFetch<T>({
    queryKey,
    url,
    enabled = true,
    autoRetry = false,
}: UseFetchProps) {
    return useQuery<T, AxiosError>({
        queryKey: queryKey,
        queryFn: async () => {
            const response = await axios.get<T>(url);
            return response.data;
        },
        enabled,
        retry: autoRetry,
    });
}
