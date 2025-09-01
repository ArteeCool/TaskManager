import { type User } from "../model/types";
import axios from "axios";

export const getCurrentUser = async (): Promise<User> => {
    const response = await axios.get<User>(
        "https://localhost:5678/api/auth/me",
        {
            withCredentials: true,
        }
    );
    return response.data;
};
