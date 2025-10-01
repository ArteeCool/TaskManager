import { useState } from "react";
import { Users, UserPlus, X, Mail } from "lucide-react";
import type { BoardInvite, BoardResponse } from "@/features/boards/model/types";
import type { User } from "@/features/auth/model/types";
import { toast } from "sonner";
import { useInviteMember } from "@/features/boards/lib/useInviteMember";
import { useGetCurrentInvites } from "@/features/boards/lib/hooks";
import { Crown, Shield, Eye } from "lucide-react";

interface BoardMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    members: User[];
    boardData: BoardResponse;
}

const BoardMembersModal = ({
    isOpen,
    onClose,
    members,
    boardData,
}: BoardMembersModalProps) => {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"members" | "invite">("members");

    const { data: currentInvites } = useGetCurrentInvites(boardData.id);
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

    const getRoleIcon = (roles: string[]) => {
        if (roles?.includes("owner"))
            return <Crown size={16} className="text-yellow-600" />;

        if (roles?.includes("admin"))
            return <Shield size={16} className="text-blue-600" />;

        return <Eye size={16} className="text-gray-600" />;
    };

    const getRoleColor = (roles: string[]) => {
        if (roles?.includes("owner")) {
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
        if (roles?.includes("admin")) {
            return "bg-blue-100 text-blue-800 border-blue-200";
        }
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    if (!isOpen) return null;

    const MemberItem = ({ member }: { member: User }) => (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    {member.avatarurl ? (
                        <img
                            src={member.avatarurl}
                            alt={member.fullname || member.email}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-sm font-medium text-primary">
                            {member.fullname || member.email}
                        </span>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                            {member.fullname || member.email}
                        </p>
                        {member.fullname && (
                            <span className="text-sm text-muted-foreground">
                                {member.email}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getRoleColor(
                        member.roles
                    )}`}
                >
                    {getRoleIcon(member.roles)}
                    {member?.roles?.includes("owner")
                        ? "Owner"
                        : member?.roles?.length > 0
                        ? member?.roles[0]?.charAt(0).toUpperCase() +
                          member?.roles[0]?.slice(1)
                        : ""}
                </span>
            </div>
        </div>
    );

    const InviteItem = ({ invite }: { invite: BoardInvite }) => (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors">
            <p className="text-foreground">{invite.invitee_email}</p>
            <span className="text-sm text-muted-foreground">
                Invited ({invite.role})
            </span>
        </div>
    );

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
                            Members {members?.length || 0}
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
                <div className="p-6 overflow-y-auto h-[calc(90vh-200px)]">
                    {activeTab === "members" && (
                        <div className="space-y-3 h-full">
                            {members?.length === 0 &&
                            currentInvites?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users
                                        size={48}
                                        className="mx-auto mb-3 opacity-50"
                                    />
                                    <p>No members or invites found</p>
                                </div>
                            ) : (
                                <>
                                    {members?.map((member: User) => (
                                        <MemberItem
                                            key={member.id}
                                            member={member}
                                        />
                                    ))}
                                    {currentInvites?.map(
                                        (invite: BoardInvite) => (
                                            <InviteItem
                                                key={invite.id}
                                                invite={invite}
                                            />
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "invite" && (
                        <div className="space-y-6 h-full">
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

export default BoardMembersModal;
