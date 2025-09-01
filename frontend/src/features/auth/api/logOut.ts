import axios from "axios";

export const logOut = async () => {
    const response = await axios.get(
        "https://localhost:5678/api/auth/log-out",
        { withCredentials: true }
    );
    return response.data;
};
