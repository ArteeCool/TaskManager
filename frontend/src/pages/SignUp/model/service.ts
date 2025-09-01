// sign-up/model/service.ts
import axios from "axios";
import type { SignUpRequest } from "./types";

interface SignUpResponse {
    token: string;
}

export const signUp = async (data: SignUpRequest): Promise<SignUpResponse> => {
    try {
        const res = await axios.post<SignUpResponse>(
            "https://arteecool.com.ua/api/auth/sign-up",
            data,
            {
                withCredentials: true,
            }
        );

        return res.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || "Sign up failed");
        }
        throw new Error("Sign up failed");
    }
};
