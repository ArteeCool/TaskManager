import { type User } from "../model/types";
import axios from "axios";

export const getCurrentUser = async (): Promise<User> => {
    const response = await axios.get<User>(
        `${import.meta.env.VITE_API_URL || ""}/api/auth/me`,
        {
            withCredentials: true,
        }
    );
    return response.data;
};
