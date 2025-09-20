import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import type {
    BoardWithListsResponse,
    Member,
    Task,
    TaskRequest,
} from "@/features/boards/model/types";

const AssigneesField = ({
    targetTask,
    boardData,
    handleUpdateTask,
}: {
    targetTask: Task;
    boardData: BoardWithListsResponse;
    handleUpdateTask: (taskId: number, payload: Partial<TaskRequest>) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const currentAssignees = (targetTask.assignees || [])
        .map((assigneeOrId) => {
            if (typeof assigneeOrId === "number") {
                return boardData.members.find((m) => m.id === assigneeOrId);
            }
            return assigneeOrId;
        })
        .filter(Boolean) as Member[];

    const availableMembers = boardData?.members || [];

    const filteredMembers = availableMembers.filter(
        (member) =>
            member.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleAssignee = (member: Member) => {
        const isAssigned = currentAssignees.some(
            (assignee) => assignee.id === member.id
        );
        let newAssignees: number[];

        if (isAssigned) {
            newAssignees = currentAssignees
                .filter((assignee) => assignee.id !== member.id)
                .map((assignee) => assignee.id);
        } else {
            newAssignees = [...currentAssignees.map((a) => a.id), member.id];
        }

        handleUpdateTask(targetTask.id, {
            assignees: newAssignees,
        });
    };

    const handleRemoveAssignee = (assigneeId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newAssignees = currentAssignees.filter(
            (assignee) => assignee.id !== assigneeId
        );
        handleUpdateTask(targetTask.id, {
            assignees: newAssignees.map((assignee) => assignee.id),
        });
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
                Assignees
            </label>

            <div className="flex flex-wrap gap-2 mb-2">
                {currentAssignees.map((assignee) => (
                    <div
                        key={assignee.id}
                        className="flex items-center gap-1 bg-background rounded-full px-2 py-1 text-sm transition-colors"
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-medium`}
                        >
                            <img
                                src={assignee.avatarurl}
                                alt={assignee.fullname}
                                className="w-full h-full rounded-full"
                            />
                        </div>
                        <span className="max-w-24 truncate">
                            {assignee.fullname}
                        </span>
                        <button
                            onClick={(e) =>
                                handleRemoveAssignee(assignee.id, e)
                            }
                            className="text-gray-400 hover:text-gray-600 ml-1"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                    <div className="flex items-center gap-2 text-foreground">
                        <Plus size={16} />
                        <span className="text-sm">
                            {currentAssignees.length === 0
                                ? "Assign members"
                                : `Add more assignees`}
                        </span>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                        <div className="p-2 border-b border-gray-100">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                            {filteredMembers.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-foreground text-center">
                                    No members found
                                </div>
                            ) : (
                                filteredMembers.map((member) => {
                                    const isAssigned = currentAssignees.some(
                                        (assignee) => assignee.id === member.id
                                    );
                                    return (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() =>
                                                handleToggleAssignee(member)
                                            }
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left bg-card transition-colors ${
                                                isAssigned
                                                    ? "bg-blue-50 dark:bg-blue-900"
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium`}
                                            >
                                                <img
                                                    src={member.avatarurl}
                                                    alt={member.fullname}
                                                    className="w-full h-full rounded-full"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">
                                                    {member.fullname}
                                                </div>
                                                {member.email && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {member.email}
                                                    </div>
                                                )}
                                            </div>
                                            {isAssigned && (
                                                <div className="text-blue-500">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssigneesField;
