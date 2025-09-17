import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, GripVertical, Check, X } from "lucide-react";
import { useGetTasksFromBoard } from "@/features/boards/lib/useGetTasksFromBoard";
import { useParams } from "react-router";
import type { ListWithTasks, Task } from "@/features/boards/model/types";
import {
    useCreateList,
    useUpdateList,
    useDeleteList,
    useCreateTask,
    useDeleteTask,
    useBatchUpdateTasks,
} from "@/features/boards/lib/hooks";
import type { UseMutationResult } from "@tanstack/react-query";
import { socket } from "@/features/boards/lib/socket";

const useTaskDragAndDrop = (
    lists: ListWithTasks[],
    updateTaskMutation: UseMutationResult<
        unknown,
        Error,
        (Partial<Task> & {
            id: number;
        })[]
    >
) => {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverList, setDragOverList] = useState<number | null>(null);
    const [dragOverTask, setDragOverTask] = useState<number | null>(null);

    const handleTaskDragStart = useCallback(
        (e: React.DragEvent<HTMLDivElement>, task: Task) => {
            setDraggedTask(task);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", "task");
            e.dataTransfer.setData("task-id", task.id.toString());
            e.dataTransfer.setData("source-list-id", task.list_id.toString());

            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.position = "absolute";
            dragImage.style.top = "-1000px";
            dragImage.style.width = `${e.currentTarget.offsetWidth}px`;
            dragImage.style.opacity = "0.9";
            dragImage.style.transform = "rotate(3deg) scale(1.05)";
            dragImage.style.zIndex = "9999";
            dragImage.style.boxShadow =
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
            dragImage.style.borderRadius = "12px";
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(
                dragImage,
                e.currentTarget.offsetWidth / 2,
                20
            );

            setTimeout(() => {
                if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage);
                }
            }, 0);
        },
        []
    );

    const handleTaskDragOver = useCallback(
        (
            e: React.DragEvent<HTMLDivElement>,
            listId: number,
            taskId: number | null = null
        ) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";

            if (e.dataTransfer.types.includes("task-id")) {
                setDragOverList(listId);
                setDragOverTask(taskId);
            }
        },
        []
    );

    const handleTaskDragLeave = useCallback(() => {
        setDragOverList(null);
        setDragOverTask(null);
    }, []);

    const handleTaskDrop = useCallback(
        (
            e: React.DragEvent<HTMLDivElement>,
            targetListId: number,
            targetTaskId: number | null = null
        ) => {
            e.preventDefault();

            if (!e.dataTransfer.types.includes("task-id") || !draggedTask)
                return;

            const sourceListId = parseInt(
                e.dataTransfer.getData("source-list-id")
            );
            const newLists = lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
            const sourceList = newLists.find((l) => l.id === sourceListId);
            const targetList = newLists.find((l) => l.id === targetListId);

            if (!sourceList || !targetList) return;

            const srcIndex = sourceList.tasks.findIndex(
                (t) => t.id === draggedTask.id
            );
            if (srcIndex === -1) return;

            const [movedTask] = sourceList.tasks.splice(srcIndex, 1);
            movedTask.list_id = targetListId;

            if (targetTaskId !== null) {
                const tgtIndex = targetList.tasks.findIndex(
                    (t) => t.id === targetTaskId
                );
                const insertIndex =
                    tgtIndex === -1 ? targetList.tasks.length : tgtIndex;
                targetList.tasks.splice(insertIndex, 0, movedTask);
            } else {
                targetList.tasks.push(movedTask);
            }

            sourceList.tasks.forEach((task, idx) => (task.position = idx));
            targetList.tasks.forEach((task, idx) => (task.position = idx));

            const tasksToUpdate = [
                {
                    id: movedTask.id,
                    list_id: movedTask.list_id,
                    position: movedTask.position,
                },
                ...sourceList.tasks.map((task) => ({
                    id: task.id,
                    position: task.position,
                })),
                ...targetList.tasks
                    .filter((task) => task.id !== movedTask.id)
                    .map((task) => ({ id: task.id, position: task.position })),
            ];

            updateTaskMutation.mutate(tasksToUpdate);

            setDraggedTask(null);
            setDragOverList(null);
            setDragOverTask(null);

            return newLists;
        },
        [draggedTask, lists, updateTaskMutation]
    );

    return {
        draggedTask,
        dragOverList,
        dragOverTask,
        handleTaskDragStart,
        handleTaskDragOver,
        handleTaskDragLeave,
        handleTaskDrop,
    };
};

const useListDragAndDrop = (
    lists: ListWithTasks[],
    updateListMutation: UseMutationResult<
        unknown,
        Error,
        Partial<ListWithTasks> & { id: number },
        unknown
    >
) => {
    const [draggedList, setDraggedList] = useState<ListWithTasks | null>(null);
    const [dragOverListId, setDragOverListId] = useState<number | null>(null);

    const handleListDragStart = useCallback(
        (e: React.DragEvent<HTMLDivElement>, list: ListWithTasks) => {
            setDraggedList(list);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("type", "list");

            const dragImage = document.createElement("div");
            dragImage.textContent = list.title;
            dragImage.style.cssText = `
                padding: 12px 16px;
                background: linear-gradient(135deg, oklch(var(--primary-500)), oklch(var(--primary-600)));
                color: white;
                border-radius: 12px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                font-weight: 600;
                opacity: 0.95;
                transform: rotate(2deg);
                position: absolute;
                top: -1000px;
                z-index: 9999;
            `;
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, 0, 0);

            setTimeout(() => document.body.removeChild(dragImage), 0);
        },
        []
    );

    const handleListDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, listId: number) => {
            e.preventDefault();
            if (e.dataTransfer.types.includes("list")) {
                setDragOverListId(listId);
            }
        },
        []
    );

    const handleListDragLeave = useCallback(() => {
        setDragOverListId(null);
    }, []);

    const handleListDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetListId: number) => {
            e.preventDefault();
            if (!draggedList || e.dataTransfer.types.includes("task")) return;

            const newLists = [...lists];
            const fromIndex = newLists.findIndex(
                (l) => l.id === draggedList.id
            );
            const toIndex = newLists.findIndex((l) => l.id === targetListId);

            if (fromIndex === toIndex) return;

            const [movedList] = newLists.splice(fromIndex, 1);
            newLists.splice(toIndex, 0, movedList);

            newLists.forEach((list, index) => {
                if (list.position !== index) {
                    updateListMutation.mutate({
                        id: list.id,
                        position: index,
                    });
                }
            });

            setDraggedList(null);
            setDragOverListId(null);

            return newLists;
        },
        [draggedList, lists, updateListMutation]
    );

    return {
        draggedList,
        dragOverListId,
        handleListDragStart,
        handleListDragOver,
        handleListDragLeave,
        handleListDrop,
    };
};

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
    handleUpdateList: (id: number, title: string) => void;
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
                            handleUpdateList(list.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter")
                                handleUpdateList(
                                    list.id,
                                    e.currentTarget.value
                                );
                            if (e.key === "Escape") setEditingList(null);
                        }}
                    />
                    <button
                        onClick={() =>
                            editListInputRef.current &&
                            handleUpdateList(
                                list.id,
                                editListInputRef.current.value
                            )
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

const TaskItem = ({
    task,
    editingTask,
    setEditingTask,
    handleUpdateTask,
    handleDeleteTask,
    handleTaskDragStart,
    handleTaskDragOver,
    handleTaskDragLeave,
    handleTaskDrop,
    editTaskInputRef,
    isDragging,
}: {
    task: Task;
    editingTask: number | null;
    setEditingTask: (id: number | null) => void;
    handleUpdateTask: (id: number, payload: Partial<Task>) => void;
    handleDeleteTask: (id: number) => void;
    handleTaskDragStart: (
        e: React.DragEvent<HTMLDivElement>,
        task: Task
    ) => void;
    handleTaskDragOver: (
        e: React.DragEvent<HTMLDivElement>,
        listId: number,
        taskId: number | null
    ) => void;
    handleTaskDragLeave: () => void;
    handleTaskDrop: (
        e: React.DragEvent<HTMLDivElement>,
        listId: number,
        taskId: number | null
    ) => void;
    editTaskInputRef: React.RefObject<HTMLInputElement | null>;
    isDragging: boolean;
}) => {
    return (
        <div
            draggable
            onDragStart={(e) => handleTaskDragStart(e, task)}
            onDragOver={(e) => handleTaskDragOver(e, task.list_id, task.id)}
            onDragLeave={handleTaskDragLeave}
            onDrop={(e) => handleTaskDrop(e, task.list_id, task.id)}
            className={`group bg-card hover:bg-card/80 p-4 rounded-xl border border-border/50 cursor-grab transition-all duration-200 hover:shadow-md hover:shadow-primary-100/50 hover:border-primary-200 ${
                isDragging
                    ? "opacity-40 scale-95 rotate-2"
                    : "hover:scale-[1.02]"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <GripVertical
                        size={14}
                        className="text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    />
                    {editingTask === task.id ? (
                        <div className="flex-1">
                            <input
                                ref={editTaskInputRef}
                                defaultValue={task.title}
                                className="w-full bg-background border-2 border-primary-400 rounded-lg px-3 py-2 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                                onBlur={(e) =>
                                    handleUpdateTask(task.id, {
                                        title: e.target.value,
                                    })
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                        handleUpdateTask(task.id, {
                                            title: e.currentTarget.value,
                                        });
                                    if (e.key === "Escape")
                                        setEditingTask(null);
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setEditingTask(task.id)}
                        >
                            <p className="text-foreground font-medium leading-relaxed">
                                {task.title}
                            </p>
                            {task.description && (
                                <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                                    {task.description}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded opacity-0 group-hover:opacity-100"
                    aria-label={`Delete task ${task.title}`}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const AddTaskForm = ({
    listId,
    addingTaskToList,
    setAddingTaskToList,
    handleAddTask,
    newTaskInputRef,
}: {
    listId: number;
    addingTaskToList: number | null;
    setAddingTaskToList: (id: number | null) => void;
    handleAddTask: (listId: number, title: string) => void;
    newTaskInputRef: React.RefObject<HTMLInputElement | null>;
}) => {
    if (addingTaskToList !== listId) {
        return (
            <button
                onClick={() => setAddingTaskToList(listId)}
                className="w-full p-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary-300 transition-all duration-200"
            >
                <Plus size={16} />
                <span className="font-medium text-sm">Add a task</span>
            </button>
        );
    }

    return (
        <div className="space-y-3">
            <input
                ref={newTaskInputRef}
                placeholder="Enter task title..."
                className="w-full p-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-200"
                onKeyDown={(e) => {
                    if (e.key === "Escape") setAddingTaskToList(null);
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        handleAddTask(listId, e.currentTarget.value.trim());
                        e.currentTarget.value = "";
                    }
                }}
            />
            <div className="flex gap-2">
                <button
                    onClick={() => {
                        if (newTaskInputRef.current?.value.trim()) {
                            handleAddTask(
                                listId,
                                newTaskInputRef.current.value.trim()
                            );
                            newTaskInputRef.current.value = "";
                        }
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    Add Task
                </button>
                <button
                    type="button"
                    onClick={() => setAddingTaskToList(null)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

const AddListSection = ({
    isAddingList,
    setIsAddingList,
    handleAddList,
    newListInputRef,
}: {
    isAddingList: boolean;
    setIsAddingList: (value: boolean) => void;
    handleAddList: (title: string) => void;
    newListInputRef: React.RefObject<HTMLInputElement | null>;
}) => {
    if (isAddingList) {
        return (
            <div className="flex-shrink-0 w-72 md:w-80 bg-card border border-border rounded-xl shadow-lg backdrop-blur-sm">
                <div className="p-4 space-y-4">
                    <input
                        ref={newListInputRef}
                        placeholder="Enter list title..."
                        className="w-full p-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-200"
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setIsAddingList(false);
                            if (
                                e.key === "Enter" &&
                                e.currentTarget.value.trim()
                            ) {
                                handleAddList(e.currentTarget.value.trim());
                                e.currentTarget.value = "";
                            }
                        }}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (newListInputRef?.current?.value.trim()) {
                                    handleAddList(
                                        newListInputRef?.current.value.trim()
                                    );
                                    newListInputRef.current.value = "";
                                }
                            }}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            Add List
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddingList(false)}
                            className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsAddingList(true)}
            className="flex-shrink-0 w-72 md:w-80 h-40 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border-2 border-dashed border-border hover:border-primary-300 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
        >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shadow-sm group-hover:bg-primary/20 transition-all duration-200">
                <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-semibold text-foreground">
                Add another list
            </span>
        </button>
    );
};

const Board = () => {
    const boardId = Number(useParams().id);
    const { data: listsData } = useGetTasksFromBoard(boardId);

    const [lists, setLists] = useState<ListWithTasks[]>([]);

    const [isAddingList, setIsAddingList] = useState(false);
    const [editingList, setEditingList] = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<number | null>(null);
    const [addingTaskToList, setAddingTaskToList] = useState<number | null>(
        null
    );

    const newListInputRef = useRef<HTMLInputElement>(null);
    const editListInputRef = useRef<HTMLInputElement>(null);
    const editTaskInputRef = useRef<HTMLInputElement>(null);
    const newTaskInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (listsData) setLists(listsData);
    }, [listsData]);

    useEffect(() => {
        if (isAddingList) newListInputRef.current?.focus();
    }, [isAddingList]);

    useEffect(() => {
        if (editingList) {
            editListInputRef.current?.focus();
            editListInputRef.current?.select();
        }
    }, [editingList]);

    useEffect(() => {
        if (editingTask) {
            editTaskInputRef.current?.focus();
            editTaskInputRef.current?.select();
        }
    }, [editingTask]);

    useEffect(() => {
        if (addingTaskToList) newTaskInputRef.current?.focus();
    }, [addingTaskToList]);

    useEffect(() => {
        socket.connect();

        socket.emit("joinBoard", boardId);

        socket.on("taskCreated", (newTask: Task) => {
            setLists((prev) =>
                prev.map((list) =>
                    list.id === newTask.list_id
                        ? { ...list, tasks: [...(list.tasks || []), newTask] }
                        : list
                )
            );
        });

        socket.on("tasksUpdated", (updatedTasks: Task[]) => {
            setLists((prevLists) => {
                const newLists = prevLists.map((list) => ({
                    ...list,
                    tasks: [...list.tasks],
                }));

                updatedTasks.forEach((task) => {
                    newLists.forEach((list) => {
                        list.tasks = list.tasks.filter((t) => t.id !== task.id);
                    });

                    const targetList = newLists.find(
                        (l) => l.id === task.list_id
                    );
                    if (targetList) {
                        targetList.tasks.push(task);
                    }
                });

                newLists.forEach((list) => {
                    list.tasks.sort((a, b) => a.position - b.position);
                });

                return newLists;
            });
        });

        socket.on(
            "taskDeleted",
            ({ taskId, listId }: { taskId: number; listId: number }) => {
                setLists((prev) =>
                    prev.map((list) =>
                        list.id === listId
                            ? {
                                  ...list,
                                  tasks: list.tasks.filter(
                                      (t) => t.id !== taskId
                                  ),
                              }
                            : list
                    )
                );
            }
        );

        socket.on("listCreated", (newList: ListWithTasks) => {
            setLists((prev) => [...prev, newList]);
        });

        socket.on("listUpdated", (updatedList: ListWithTasks) => {
            setLists((prevLists) => {
                const newLists = prevLists.map((list) =>
                    list.id === updatedList.id
                        ? { ...list, ...updatedList }
                        : list
                );

                newLists.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                return newLists;
            });
        });

        socket.on("listDeleted", (deletedListId: number) => {
            setLists((prev) =>
                prev.filter((list) => list.id !== deletedListId)
            );
        });

        return () => {
            socket.off("taskCreated");
            socket.off("tasksUpdated");
            socket.off("taskDeleted");
            socket.off("listCreated");
            socket.off("listUpdated");
            socket.off("listDeleted");
            socket.disconnect();
        };
    }, [boardId]);

    const createListMutation = useCreateList();
    const updateListMutation = useUpdateList();
    const deleteListMutation = useDeleteList();

    const createTaskMutation = useCreateTask();
    const updateTaskMutation = useBatchUpdateTasks();
    const deleteTaskMutation = useDeleteTask();

    const handleAddList = (title: string) => {
        if (!title.trim()) return;
        createListMutation.mutate(
            { board_id: boardId, title: title.trim() },
            {
                onSuccess: () => setIsAddingList(false),
                onError: (error) =>
                    console.error("Failed to create list:", error),
            }
        );
    };

    const handleUpdateList = (listId: number, newTitle: string) => {
        if (!newTitle.trim()) return;
        updateListMutation.mutate(
            { id: listId, title: newTitle.trim() },
            {
                onSuccess: () => setEditingList(null),
                onError: (error) =>
                    console.error("Failed to update list:", error),
            }
        );
    };

    const handleDeleteList = (listId: number) => {
        deleteListMutation.mutate(listId, {
            onError: (error) => console.error("Failed to delete list:", error),
        });
    };

    const handleAddTask = (listId: number, title: string) => {
        if (!title.trim()) return;
        createTaskMutation.mutate(
            {
                list_id: listId,
                title: title.trim(),
                description: "",
                position: 0,
            },
            {
                onSuccess: () => setAddingTaskToList(null),
                onError: (error) =>
                    console.error("Failed to create task:", error),
            }
        );
    };

    const handleUpdateTask = (taskId: number, payload: Partial<Task>) => {
        updateTaskMutation.mutate([{ id: taskId, ...payload }], {
            onSuccess: () => setEditingTask(null),
            onError: (error: unknown) =>
                console.error("Failed to update task:", error),
        });
    };

    const handleDeleteTask = (taskId: number) => {
        deleteTaskMutation.mutate(taskId, {
            onError: (error) => console.error("Failed to delete task:", error),
        });
    };

    const {
        draggedTask,
        dragOverList,
        dragOverTask,
        handleTaskDragStart,
        handleTaskDragOver,
        handleTaskDragLeave,
        handleTaskDrop,
    } = useTaskDragAndDrop(lists, updateTaskMutation);

    const {
        dragOverListId,
        handleListDragStart,
        handleListDragOver,
        handleListDragLeave,
        handleListDrop,
    } = useListDragAndDrop(lists, updateListMutation);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, listId: number) => {
            e.preventDefault();

            if (e.dataTransfer.types.includes("task-id")) {
                handleTaskDrop(e, listId, null);
            } else if (e.dataTransfer.types.includes("list-id")) {
                handleListDrop(e, listId);
            }
        },
        [handleTaskDrop, handleListDrop]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, listId: number) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";

            if (e.dataTransfer.types.includes("task-id")) {
                handleTaskDragOver(e, listId, null);
            } else if (e.dataTransfer.types.includes("list-id")) {
                handleListDragOver(e, listId);
            }
        },
        [handleTaskDragOver, handleListDragOver]
    );

    const [inviteEmail, setInviteEmail] = useState("");

    const handleInvite = () => {
        if (!inviteEmail.trim()) return;
        fetch(
            `${
                import.meta.env.VITE_API_URL || ""
            }/api/boards/${boardId}/invite`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: inviteEmail }),
            }
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.message) alert(data.message);
                setInviteEmail("");
            })
            .catch(console.error);
    };

    return (
        <div className="flex-1 bg-background p-4 md:p-6">
            <div className="max-w-full mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Project Board
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Organize your tasks and track progress
                    </p>
                </div>

                <div className="flex gap-2 items-center p-4">
                    <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Invite user by email"
                        className="border p-2 rounded flex-1"
                    />
                    <button
                        onClick={handleInvite}
                        className="px-3 py-2 bg-foreground text-background rounded"
                    >
                        Invite
                    </button>
                </div>

                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 min-h-[600px]">
                    {lists.map((list) => (
                        <div
                            key={list.id}
                            className={`flex-shrink-0 w-72 md:w-80 bg-card rounded-2xl shadow-lg border transition-all duration-200 ${
                                dragOverList === list.id && !dragOverTask
                                    ? "ring-2 ring-blue-400 shadow-xl scale-[1.02]"
                                    : ""
                            }`}
                            onDragOver={(e) => handleDragOver(e, list.id)}
                            onDragLeave={() => {
                                handleTaskDragLeave();
                                handleListDragLeave();
                            }}
                            onDrop={(e) => handleDrop(e, list.id)}
                        >
                            <ListHeader
                                list={list}
                                editingList={editingList}
                                setEditingList={setEditingList}
                                handleUpdateList={handleUpdateList}
                                handleDeleteList={handleDeleteList}
                                editListInputRef={editListInputRef}
                                onDragStart={handleListDragStart}
                                onDragOver={handleListDragOver}
                                onDragLeave={handleListDragLeave}
                                onDrop={handleListDrop}
                                isDraggingOver={dragOverListId === list.id}
                            />

                            {list?.tasks?.length > 0 ? (
                                list.tasks
                                    .sort((a, b) => a.position - b.position)
                                    .map((task) => (
                                        <div key={task.id}>
                                            {dragOverTask === task.id && (
                                                <div className="h-2 bg-background rounded-full opacity-50 mb-2" />
                                            )}
                                            <TaskItem
                                                task={task}
                                                editingTask={editingTask}
                                                setEditingTask={setEditingTask}
                                                handleUpdateTask={
                                                    handleUpdateTask
                                                }
                                                handleDeleteTask={
                                                    handleDeleteTask
                                                }
                                                handleTaskDragStart={
                                                    handleTaskDragStart
                                                }
                                                handleTaskDragOver={
                                                    handleTaskDragOver
                                                }
                                                handleTaskDragLeave={
                                                    handleTaskDragLeave
                                                }
                                                handleTaskDrop={handleTaskDrop}
                                                editTaskInputRef={
                                                    editTaskInputRef
                                                }
                                                isDragging={
                                                    draggedTask?.id === task.id
                                                }
                                            />
                                        </div>
                                    ))
                            ) : (
                                <p className="text-sm text-foreground">
                                    No tasks yet
                                </p>
                            )}

                            {/* Add Task Form */}
                            <div className="p-4 border-t border-border bg-card rounded-b-2xl">
                                <AddTaskForm
                                    listId={list.id}
                                    addingTaskToList={addingTaskToList}
                                    setAddingTaskToList={setAddingTaskToList}
                                    handleAddTask={handleAddTask}
                                    newTaskInputRef={newTaskInputRef}
                                />
                            </div>
                        </div>
                    ))}

                    <AddListSection
                        isAddingList={isAddingList}
                        setIsAddingList={setIsAddingList}
                        handleAddList={handleAddList}
                        newListInputRef={newListInputRef}
                    />
                </div>
            </div>
        </div>
    );
};

export default Board;
