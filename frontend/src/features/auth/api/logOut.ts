import axios from "axios";

export const logOut = async () => {
    const response = await axios.get(
        "https://arteecool.com.ua/api/auth/log-out",
        { withCredentials: true }
    );
    return response.data;
};
