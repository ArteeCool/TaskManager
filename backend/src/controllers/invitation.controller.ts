import { type Response } from "express";
import { type MutatedRequest } from "../types/auth.types.ts";
import crypto from "crypto";
import { queryDB } from "../database/db.ts";
import { sendEmail } from "../controllers/email.controller.ts";

export const sendInvite = async (req: MutatedRequest, res: Response) => {
    try {
        const inviterId = req.user?.id;
        const boardId = Number(req.params.id);
        const { email, role } = req.body;

        if (!inviterId)
            return res.status(401).json({ message: "Unauthorized" });
        if (!email)
            return res.status(400).json({ message: "Email is required" });

        const finalRole = role === "admin" ? "admin" : "member";

        const check = await queryDB(
            "SELECT 1 FROM board_users WHERE user_id=$1 AND board_id=$2",
            [inviterId, boardId]
        );
        if (!check?.rows.length)
            return res.status(403).json({ message: "Not your board" });

        const token = crypto.randomBytes(32).toString("hex");

        await queryDB(
            `INSERT INTO board_invitations (board_id, inviter_id, invitee_email, role, token)
       VALUES ($1,$2,$3,$4,$5)`,
            [boardId, inviterId, email, finalRole, token]
        );

        const acceptUrl = `${
            process.env.SERVER_URL || ""
        }/api/board-invites/accept-invite/${token}`;

        await sendEmail(
            email,
            "Board Invitation",
            `<p>You were invited to a board with role <b>${finalRole}</b>.</p>
       <p><a href="${acceptUrl}">Click here to accept</a></p>`
        );

        res.status(200).json({ message: "Invite sent" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const acceptInvite = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const token = req.params.id;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const invRes = await queryDB(
            `SELECT * FROM board_invitations WHERE token=$1 AND expires_at>now()`,
            [token]
        );

        if (!invRes?.rows.length)
            return res
                .status(400)
                .json({ message: "Invalid or expired invite" });

        const invitation = invRes?.rows[0];

        const userRes = await queryDB("SELECT email FROM users WHERE id=$1", [
            userId,
        ]);

        if (
            userRes?.rows[0].email.toLowerCase() !==
            invitation.invitee_email.toLowerCase()
        ) {
            return res
                .status(403)
                .json({ message: "This invite is for a different email" });
        }

        const existsRes = await queryDB(
            "SELECT 1 FROM board_users WHERE user_id=$1 AND board_id=$2",
            [userId, invitation.board_id]
        );

        if (!existsRes?.rows.length) {
            await queryDB(
                "INSERT INTO board_users (user_id, board_id, role) VALUES ($1,$2,$3)",
                [userId, invitation.board_id, invitation.role]
            );
        }

        await queryDB("DELETE FROM board_invitations WHERE token=$1", [token]);

        res.redirect(process.env.CLIENT_URL || "");
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
