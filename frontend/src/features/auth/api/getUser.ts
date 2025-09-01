import { type User } from "../model/types";
import axios from "axios";

export const getCurrentUser = async (): Promise<User> => {
    const response = await axios.get<User>(
        "https://arteecool.com.ua/api/auth/me",
        {
            withCredentials: true,
        }
    );
    return response.data;
};
