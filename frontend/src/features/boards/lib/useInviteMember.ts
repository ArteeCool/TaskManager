import { useMutation } from "@tanstack/react-query";
import type { BoardResponse } from "../model/types";
import axios from "axios";

export const useInviteMember = () => {
    return useMutation({
        mutationKey: ["invite-member"],
        mutationFn: async ({
            boardData,
            inviteEmail,
            inviteRole,
        }: {
            boardData: BoardResponse;
            inviteEmail: string;
            inviteRole: "member" | "admin";
        }) => {
            try {
                return await axios.post(
                    `${
                        import.meta.env.VITE_API_URL || ""
                    }/api/board-invites/send-invite/${boardData.id}`,
                    {
                        email: inviteEmail.trim(),
                        role: inviteRole,
                    },
                    { withCredentials: true }
                );
            } catch (error) {
                console.error("Failed to invite user:", error);
                if (axios.isAxiosError(error)) throw error;
                throw new Error("Failed to invite user");
            }
        },
    });
};
