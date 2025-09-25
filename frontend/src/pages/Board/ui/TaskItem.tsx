import type { Task } from "@/features/boards/model/types";
import { GripVertical, Trash2 } from "lucide-react";

const TaskItem = ({
    task,
    handleDeleteTask,
    listId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragged,
    setTargetTask,
}: {
    task: Task;
    handleDeleteTask: (id: number) => void;
    listId: number;
    handleDragStart: (
        e: React.DragEvent<HTMLDivElement>,
        task: Task,
        listId: number
    ) => void;
    handleDragOver: (
        e: React.DragEvent<HTMLDivElement>,
        listId: number,
        taskId: number
    ) => void;
    handleDragLeave: () => void;
    handleDrop: (
        e: React.DragEvent<HTMLDivElement>,
        listId: number,
        taskId: number
    ) => void;
    isDragged: boolean;
    setTargetTask: React.Dispatch<React.SetStateAction<Task | null>>;
}) => {
    return (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, task, listId)}
            onDragOver={(e) => handleDragOver(e, task.list_id, task.position)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, task.list_id, task.position)}
            onClick={() => setTargetTask(task)}
            className={`group bg-card hover:bg-card/80 p-4 rounded-xl border border-border/50 cursor-grab transition-all duration-200 hover:shadow-md hover:shadow-primary-100/50 hover:border-primary-200 ${
                isDragged ? "opacity-40 scale-95" : "hover:scale-[1.02]"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <GripVertical
                        size={14}
                        className="text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    />
                    <div className="flex-1 cursor-pointer">
                        <p className="text-foreground font-medium leading-relaxed text-wrap wrap-anywhere">
                            {task.title}
                        </p>
                        {task.description && (
                            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                                {task.description}
                            </p>
                        )}
                    </div>
                    <div>
                        {task.assignees && task.assignees.length > 0 && (
                            <div className="flex -space-x-2">
                                {task.assignees.map((assignee, index) => (
                                    <img
                                        key={index}
                                        src={assignee.avatarurl}
                                        alt={assignee.fullname}
                                        className="w-8 h-8 rounded-full border border-border/50"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded opacity-0 group-hover:opacity-100"
                    aria-label={`Delete task ${task.title}`}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

export default TaskItem;
