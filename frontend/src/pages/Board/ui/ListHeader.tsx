import type { ListWithTasks, ListRequest } from "@/features/boards/model/types";
import { Check, GripVertical, Trash2, X } from "lucide-react";

const ListHeader = ({
    list,
    editingList,
    setEditingList,
    handleUpdateList,
    handleDeleteList,
    editListInputRef,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    isDraggingOver,
}: {
    list: ListWithTasks;
    editingList: number | null;
    setEditingList: (id: number | null) => void;
    handleUpdateList: (data: Partial<ListRequest>) => void;
    handleDeleteList: (id: number) => void;
    editListInputRef: React.RefObject<HTMLInputElement | null>;
    onDragStart: (
        e: React.DragEvent<HTMLDivElement>,
        list: ListWithTasks
    ) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, listId: number) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, listId: number) => void;
    isDraggingOver: boolean;
}) => {
    return (
        <div
            className={`p-4 bg-gradient-to-r from-card to-card/90 backdrop-blur-sm border-b border-border/50 flex items-center justify-between rounded-t-xl transition-all duration-200 ${
                isDraggingOver
                    ? "ring-2 ring-primary-400 shadow-lg scale-[1.02]"
                    : ""
            }`}
            draggable
            onDragStart={(e) => onDragStart(e, list)}
            onDragOver={(e) => onDragOver(e, list.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, list.id)}
        >
            {editingList === list.id ? (
                <div className="flex-1 flex items-center gap-2">
                    <input
                        ref={editListInputRef}
                        defaultValue={list.title}
                        className="flex-1 bg-background border-2 border-primary-400 rounded-lg px-3 py-2 text-sm outline-none font-semibold text-foreground focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                        onBlur={(e) =>
                            handleUpdateList({
                                id: list.id,
                                title: e.target.value,
                            })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter")
                                handleUpdateList({
                                    id: list.id,
                                    title: e.currentTarget.value,
                                });
                            if (e.key === "Escape") setEditingList(null);
                        }}
                    />
                    <button
                        onClick={() =>
                            editListInputRef.current &&
                            handleUpdateList({
                                id: list.id,
                                title: editListInputRef.current.value,
                            })
                        }
                        className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    >
                        <Check size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditingList(null)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1">
                        <GripVertical
                            size={16}
                            className="text-muted-foreground cursor-grab hover:text-foreground transition-colors duration-200"
                        />
                        <h3
                            onClick={() => setEditingList(list.id)}
                            className="font-semibold text-foreground cursor-pointer hover:text-primary-600 transition-colors duration-200"
                        >
                            {list.title}
                        </h3>
                        <div className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full font-medium border border-primary-200">
                            {list.tasks?.length ?? 0}
                        </div>
                    </div>
                    <button
                        onClick={() => handleDeleteList(list.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                        aria-label={`Delete list ${list.title}`}
                    >
                        <Trash2 size={16} />
                    </button>
                </>
            )}
        </div>
    );
};

export default ListHeader;
