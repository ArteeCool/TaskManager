import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useAcceptInvite = (token?: string | null) => {
    return useQuery({
        queryKey: ["accept-invite", token],
        queryFn: async () => {
            if (!token) return null;
            const res = await axios.get(
                `${
                    import.meta.env.VITE_API_URL || ""
                }/api/board-invites/accept-invite?token=${token}`,
                {
                    withCredentials: true,
                }
            );
            return res.data;
        },
        enabled: !!token,
    });
};
