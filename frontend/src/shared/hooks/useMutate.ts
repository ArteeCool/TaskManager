import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface MutationFunctionProps<TRequest> {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    body?: TRequest;
}

interface UseMutateProps {
    mutationKey: string[];
}

export const useMutate = <TRequest, TResponse>({
    mutationKey,
}: UseMutateProps) => {
    const mutation = useMutation<
        TResponse,
        unknown,
        MutationFunctionProps<TRequest>
    >({
        mutationKey,
        mutationFn: async ({
            url,
            method,
            body,
        }: MutationFunctionProps<TRequest>) => {
            const response = await axios({
                url,
                method,
                data: body,
            });
            return response.data;
        },
    });

    return mutation;
};
