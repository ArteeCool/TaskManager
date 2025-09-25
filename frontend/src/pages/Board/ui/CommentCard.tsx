import type { Comment } from "@/features/boards/model/types";
import { Button } from "@/shared/ui";
import { Trash2 } from "lucide-react";

const CommentCard = ({
    comment,
    onDelete,
    canDelete,
}: {
    comment: Comment;
    onDelete?: () => void;
    canDelete?: boolean;
}) => {
    return (
        <>
            {comment && comment.author && (
                <div className="group bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                        <img
                            className="w-8 h-8 rounded-full border border-border/50"
                            src={comment.author.avatarurl}
                            alt={comment.author.fullname}
                        />

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex flex-col">
                                    <h3 className="text-sm font-semibold text-foreground truncate">
                                        {comment.author.fullname}
                                    </h3>
                                    <p className="text-xs text-foreground/70 truncate">
                                        {comment.author.email}
                                    </p>
                                </div>

                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 transition-all duration-200 text-gray-400 hover:text-red-500 rounded-full"
                                        onClick={onDelete}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="text-xs text-gray-400 mb-2">
                                {new Date(comment.created_at).toLocaleString()}
                            </div>
                            <div className="bg-background/50 rounded-lg p-3 border border-border">
                                <p className="text-sm text-foreground leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CommentCard;
