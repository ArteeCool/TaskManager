// log-in/model/service.ts
import axios from "axios";
import type { LogInFormData } from "./types";

interface LoginResponse {
    token: string;
}

export const login = async (data: LogInFormData): Promise<LoginResponse> => {
    try {
        const res = await axios.post<LoginResponse>(
            "http://localhost:5678/api/auth/log-in",
            data,
            {
                withCredentials: true,
            }
        );

        return res.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || "Login failed");
        }
        throw new Error("Login failed");
    }
};
