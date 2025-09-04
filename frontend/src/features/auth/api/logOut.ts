import axios from "axios";

export const logOut = async () => {
    const response = await axios.get(
        `${import.meta.env.VITE_API_URL || ""}/api/auth/log-out`,
        { withCredentials: true }
    );
    return response.data;
};
