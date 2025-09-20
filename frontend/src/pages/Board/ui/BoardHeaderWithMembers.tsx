import { useState, useEffect } from "react";
import {
    Users,
    UserPlus,
    X,
    Settings,
    Mail,
    Crown,
    Shield,
    Eye,
} from "lucide-react";
import type { BoardResponse } from "@/features/boards/model/types";
import { toast } from "sonner";
import { useInviteMember } from "@/features/boards/lib/useInviteMember";

const BoardMembersModal = ({
    isOpen,
    onClose,
    boardData,
}: {
    isOpen: boolean;
    onClose: () => void;
    boardData: BoardResponse;
}) => {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"members" | "invite">("members");

    const inviteMutation = useInviteMember();

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;

        setLoading(true);
        try {
            const result = await inviteMutation.mutateAsync({
                boardData,
                inviteEmail,
                inviteRole,
            });

            if (result.status === 200) {
                setInviteEmail("");
                setActiveTab("members");
                toast.success(
                    result.data.message || "Invitation sent successfully!"
                );
            } else {
                toast.error(result.data.message || "Failed to send invitation");
            }
        } catch (error) {
            console.error("Failed to invite user:", error);
            toast.error("Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: number) => {
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            const response = await fetch(
                `${
                    import.meta.env.VITE_API_URL || ""
                }/api/boards/${boardId}/members/${memberId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (response.ok) {
                fetchMembers(); // Refresh members list
            } else {
                const data = await response.json();
                alert(data.message || "Failed to remove member");
            }
        } catch (error) {
            console.error("Failed to remove member:", error);
            alert("Failed to remove member");
        }
    };

    const handleRoleChange = async (
        memberId: number,
        newRole: "member" | "admin"
    ) => {
        try {
            const response = await fetch(
                `${
                    import.meta.env.VITE_API_URL || ""
                }/api/boards/${boardId}/members/${memberId}/role`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ role: newRole }),
                }
            );

            if (response.ok) {
                fetchMembers(); // Refresh members list
            } else {
                const data = await response.json();
                alert(data.message || "Failed to update member role");
            }
        } catch (error) {
            console.error("Failed to update member role:", error);
            alert("Failed to update member role");
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "owner":
                return <Crown size={16} className="text-yellow-600" />;
            case "admin":
                return <Shield size={16} className="text-blue-600" />;
            default:
                return <Eye size={16} className="text-gray-600" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "owner":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "admin":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-card to-card/90">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">
                                    Board Members
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage who has access to this board
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X size={20} className="text-muted-foreground" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === "members"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                            Members {boardData.member_count || 0}
                        </button>
                        <button
                            onClick={() => setActiveTab("invite")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === "invite"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                            <UserPlus size={16} className="inline mr-2" />
                            Invite
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {activeTab === "members" && (
                        <div className="space-y-3">
                            {/* {members.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users
                                        size={48}
                                        className="mx-auto mb-3 opacity-50"
                                    />
                                    <p>No members found</p>
                                </div>
                            ) : (
                                members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={
                                                            member.name ||
                                                            member.email
                                                        }
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-primary">
                                                        {(
                                                            member.name ||
                                                            member.email
                                                        )
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-foreground">
                                                        {member.name ||
                                                            member.email}
                                                    </p>
                                                    {member.name && (
                                                        <span className="text-sm text-muted-foreground">
                                                            {member.email}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Joined{" "}
                                                    {new Date(
                                                        member.joinedAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {member.role !== "owner" ? (
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) =>
                                                            handleRoleChange(
                                                                member.id,
                                                                e.target
                                                                    .value as
                                                                    | "member"
                                                                    | "admin"
                                                            )
                                                        }
                                                        className="text-xs px-2 py-1 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    >
                                                        <option value="member">
                                                            Member
                                                        </option>
                                                        <option value="admin">
                                                            Admin
                                                        </option>
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getRoleColor(
                                                            member.role
                                                        )}`}
                                                    >
                                                        {getRoleIcon(
                                                            member.role
                                                        )}
                                                        Owner
                                                    </span>
                                                )}
                                            </div>
                                            {member.role !== "owner" && (
                                                <button
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            member.id
                                                        )
                                                    }
                                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                    title="Remove member"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )} */}
                        </div>
                    )}

                    {activeTab === "invite" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Mail
                                    size={48}
                                    className="mx-auto mb-3 text-primary opacity-70"
                                />
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Invite New Member
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Send an invitation to collaborate on this
                                    board
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) =>
                                            setInviteEmail(e.target.value)
                                        }
                                        placeholder="colleague@company.com"
                                        className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) =>
                                            setInviteRole(
                                                e.target.value as
                                                    | "member"
                                                    | "admin"
                                            )
                                        }
                                        className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        disabled={loading}
                                    >
                                        <option value="member">
                                            Member - Can view and edit tasks
                                        </option>
                                        <option value="admin">
                                            Admin - Can manage board and members
                                        </option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteEmail.trim() || loading}
                                    className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                                >
                                    {loading
                                        ? "Sending Invitation..."
                                        : "Send Invitation"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BoardHeaderWithMembers = ({
    boardData,
    title,
    description,
}: {
    boardData: BoardResponse;
    title: string;
    description: string;
}) => {
    const [showMembersModal, setShowMembersModal] = useState(false);

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {title}
                    </h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowMembersModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted rounded-xl border border-border transition-all hover:shadow-md group"
                    >
                        <Users
                            size={20}
                            className="text-primary group-hover:scale-110 transition-transform"
                        />
                        <span className="font-medium text-foreground">
                            {boardData.member_count}{" "}
                            {boardData.member_count === 1
                                ? "Member"
                                : "Members"}
                        </span>
                        <Settings
                            size={16}
                            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </button>
                </div>
            </div>

            <BoardMembersModal
                isOpen={showMembersModal}
                onClose={() => setShowMembersModal(false)}
                boardData={boardData}
            />
        </>
    );
};

export { BoardMembersModal, BoardHeaderWithMembers };
