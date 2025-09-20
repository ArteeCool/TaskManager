import { useState, useEffect, useCallback, useRef } from "react";
import {
    Plus,
    Trash2,
    GripVertical,
    Check,
    X,
    MessageSquare,
} from "lucide-react";
import { useGetBoardData } from "@/features/boards/lib/useBoardData";
import { useNavigate, useParams } from "react-router";
import type {
    BoardResponse,
    BoardWithListsResponse,
    ListWithTasks,
    Member,
    Task,
    TaskRequest,
} from "@/features/boards/model/types";
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
import { BoardHeaderWithMembers } from "./BoardHeaderWithMembers";
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Input,
} from "@/shared/ui";
import AssigneesField from "./AssigneesField";
import { useUser } from "@/features/auth/lib/useUser";

const useTaskDragAndDrop = (
    board: BoardWithListsResponse,
    setLists: React.Dispatch<React.SetStateAction<BoardWithListsResponse>>,
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
            const newLists = board.lists.map((l) => ({
                ...l,
                tasks: [...(l.tasks || [])],
            }));
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

            setLists({ ...board, lists: newLists });
        },
        [draggedTask, board, setLists, updateTaskMutation]
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
    board: BoardWithListsResponse,
    setLists: React.Dispatch<React.SetStateAction<BoardWithListsResponse>>,
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
            e.dataTransfer.setData("list-id", list.id.toString());
        },
        []
    );

    const handleListDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>, targetListId: number) => {
            e.preventDefault();
            if (!draggedList || e.dataTransfer.types.includes("task")) return;

            const newLists = [...board.lists];
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

            setLists({ ...board, lists: newLists });
        },
        [board, draggedList, setLists, updateListMutation]
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
    handleDeleteTask,
    handleTaskDragStart,
    handleTaskDragOver,
    handleTaskDragLeave,
    handleTaskDrop,
    isDragging,
    setTargetTask,
}: {
    task: Task;
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
    isDragging: boolean;
    setTargetTask: React.Dispatch<React.SetStateAction<Task | null>>;
}) => {
    return (
        <div
            draggable
            onDragStart={(e) => handleTaskDragStart(e, task)}
            onDragOver={(e) => handleTaskDragOver(e, task.list_id, task.id)}
            onDragLeave={handleTaskDragLeave}
            onDrop={(e) => handleTaskDrop(e, task.list_id, task.id)}
            onClick={() => setTargetTask(task)}
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
                    <div className="flex-1 cursor-pointer">
                        <p className="text-foreground font-medium leading-relaxed">
                            {task.title}
                        </p>
                        {task.description && (
                            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                                {task.description}
                            </p>
                        )}
                    </div>
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
    const { data: boardData, isError } = useGetBoardData(boardId);
    const { user } = useUser();

    const navigate = useNavigate();

    const [currentBoardData, setCurrentBoardData] =
        useState<BoardWithListsResponse>({
            board: {} as BoardResponse,
            lists: [] as ListWithTasks[],
            members: [] as Member[],
        });

    const [targetTask, setTargetTask] = useState<Task | null>(null);
    const [isAddingList, setIsAddingList] = useState(false);
    const [editingList, setEditingList] = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<number | null>(null);
    const [addingTaskToList, setAddingTaskToList] = useState<number | null>(
        null
    );
    const [newComment, setNewComment] = useState({ content: "" });

    const newListInputRef = useRef<HTMLInputElement>(null);
    const editListInputRef = useRef<HTMLInputElement>(null);
    const editTaskInputRef = useRef<HTMLInputElement>(null);
    const newTaskInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isError) navigate("/404");
    }, [boardData, isError, navigate]);

    useEffect(() => {
        if (boardData) setCurrentBoardData(boardData);
    }, [boardData]);

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
            setCurrentBoardData((prev) =>
                prev
                    ? {
                          ...prev,
                          lists: prev.lists.map((list) =>
                              list.id === newTask.list_id
                                  ? {
                                        ...list,
                                        tasks: [...(list.tasks || []), newTask],
                                    }
                                  : list
                          ),
                      }
                    : prev
            );
        });

        socket.on("tasksUpdated", (updatedTasks: Task[]) => {
            setCurrentBoardData((prev) => {
                if (!prev) return prev;

                const listMap = new Map(
                    prev.lists.map((l) => [
                        l.id,
                        { ...l, tasks: [...(l.tasks || [])] },
                    ])
                );

                updatedTasks.forEach((task) => {
                    listMap.forEach((list) => {
                        list.tasks = list.tasks.filter((t) => t.id !== task.id);
                    });

                    const targetList = listMap.get(task.list_id);
                    if (targetList) targetList.tasks.push(task);
                });

                const newLists = Array.from(listMap.values()).map((list) => ({
                    ...list,
                    tasks: list.tasks.sort((a, b) => a.position - b.position),
                }));

                return { ...prev, lists: newLists };
            });
        });

        socket.on(
            "taskDeleted",
            ({ taskId, listId }: { taskId: number; listId: number }) => {
                setCurrentBoardData((prev) =>
                    prev
                        ? {
                              ...prev,
                              lists: prev.lists.map((list) =>
                                  list.id === listId
                                      ? {
                                            ...list,
                                            tasks: (list.tasks || []).filter(
                                                (t) => t.id !== taskId
                                            ),
                                        }
                                      : list
                              ),
                          }
                        : prev
                );
            }
        );

        socket.on("listCreated", (newList: ListWithTasks) => {
            setCurrentBoardData((prev) =>
                prev
                    ? {
                          ...prev,
                          lists: [
                              ...prev.lists,
                              { ...newList, tasks: newList.tasks || [] },
                          ],
                      }
                    : prev
            );
        });

        socket.on("listUpdated", (updatedList: ListWithTasks) => {
            setCurrentBoardData((prev) => {
                if (!prev) return prev;

                const newLists = prev.lists.map((list) =>
                    list.id === updatedList.id
                        ? {
                              ...list,
                              ...updatedList,
                              tasks: updatedList.tasks || [],
                          }
                        : list
                );

                newLists.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                return { ...prev, lists: newLists };
            });
        });

        socket.on("listDeleted", (deletedListId: number) => {
            setCurrentBoardData((prev) =>
                prev
                    ? {
                          ...prev,
                          lists: prev.lists.filter(
                              (list) => list.id !== deletedListId
                          ),
                      }
                    : prev
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

    const handleUpdateTask = (
        taskId: number,
        payload: Partial<TaskRequest>
    ) => {
        updateTaskMutation.mutate(
            [{ id: taskId, ...payload } as Partial<Task> & { id: number }],
            {
                onSuccess: () => setEditingTask(null),
                onError: (error: unknown) =>
                    console.error("Failed to update task:", error),
            }
        );
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
    } = useTaskDragAndDrop(
        currentBoardData,
        setCurrentBoardData,
        updateTaskMutation
    );

    const {
        dragOverListId,
        handleListDragStart,
        handleListDragOver,
        handleListDragLeave,
        handleListDrop,
    } = useListDragAndDrop(
        currentBoardData,
        setCurrentBoardData,
        updateListMutation
    );

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

    return (
        <div className="flex-1 bg-background p-4 md:p-6">
            <div className="max-w-full mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Project Board
                    </h1>
                </div>

                {boardData?.board && (
                    <BoardHeaderWithMembers
                        boardData={boardData.board}
                        description="Organize your tasks and track progress"
                        title={boardData.board.title}
                    />
                )}

                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 min-h-[600px]">
                    {currentBoardData.lists.map((list) => (
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
                                                isDragging={
                                                    draggedTask?.id === task.id
                                                }
                                                setTargetTask={setTargetTask}
                                            />
                                        </div>
                                    ))
                            ) : (
                                <div className="flex flex-col justify-center py-6 px-8">
                                    <div className="text-gray-400 text-sm font-medium">
                                        No tasks yet
                                    </div>
                                    <div className="text-gray-300 text-xs mt-1">
                                        Add your first task
                                    </div>
                                </div>
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

                <Dialog
                    open={!!targetTask}
                    onOpenChange={() => setTargetTask(null)}
                >
                    <DialogContent className="!w-full !max-w-4xl flex flex-col items-start max-h-[90vh] overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                        </DialogHeader>
                        {targetTask && (
                            <div className="w-full space-y-6 overflow-y-auto flex-1">
                                {/* Title Field */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="task-title"
                                        className="text-sm font-medium"
                                    >
                                        Title
                                    </label>
                                    <Input
                                        id="task-title"
                                        value={targetTask.title}
                                        onChange={(e) => {
                                            setTargetTask({
                                                ...targetTask,
                                                title: e.target.value,
                                            });
                                            handleUpdateTask(targetTask.id, {
                                                title: targetTask.title,
                                            });
                                        }}
                                    />
                                </div>

                                <AssigneesField
                                    targetTask={targetTask}
                                    boardData={currentBoardData}
                                    handleUpdateTask={(
                                        taskId: number,
                                        payload: Partial<TaskRequest>
                                    ) => {
                                        const updatedTask: Task = {
                                            ...targetTask,
                                            ...payload,
                                            assignees:
                                                payload.assignees?.map(
                                                    (id) =>
                                                        currentBoardData.members.find(
                                                            (m) => m.id === id
                                                        )!
                                                ) || targetTask.assignees,
                                        };

                                        setTargetTask(updatedTask);

                                        handleUpdateTask(taskId, payload);
                                    }}
                                />

                                {/* Enhanced Comments Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            Comments
                                            {(targetTask?.comments?.length ??
                                                0) > 0 && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    {targetTask?.comments
                                                        ?.length ?? 0}
                                                </span>
                                            )}
                                        </label>
                                    </div>

                                    {/* Existing Comments */}
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {targetTask.comments?.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">
                                                    No comments yet
                                                </p>
                                            </div>
                                        ) : (
                                            targetTask.comments?.map(
                                                (comment, index) => (
                                                    <div
                                                        key={index}
                                                        className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div>
                                                                    <div className="font-medium text-sm text-gray-900">
                                                                        {
                                                                            comment
                                                                                .author
                                                                                .fullname
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => {
                                                                    const newComments =
                                                                        targetTask.comments?.filter(
                                                                            (
                                                                                _,
                                                                                i
                                                                            ) =>
                                                                                i !==
                                                                                index
                                                                        ) || [];
                                                                    setTargetTask(
                                                                        {
                                                                            ...targetTask,
                                                                            comments:
                                                                                newComments,
                                                                        }
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>

                                                        {/* Comment Content */}
                                                        <textarea
                                                            className="w-full p-3 text-sm border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                            value={comment.text}
                                                            onChange={(e) => {
                                                                const newComments =
                                                                    [
                                                                        ...(targetTask.comments ||
                                                                            []),
                                                                    ];
                                                                newComments[
                                                                    index
                                                                ] = {
                                                                    ...newComments[
                                                                        index
                                                                    ],
                                                                    text: e
                                                                        .target
                                                                        .value,
                                                                };
                                                                setTargetTask({
                                                                    ...targetTask,
                                                                    comments:
                                                                        newComments,
                                                                });
                                                            }}
                                                            rows={3}
                                                            placeholder="Edit comment..."
                                                        />
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>

                                    <div className="border-2 border-dashed border-border rounded-lg p-4 bg-card">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user?.avatarurl}
                                                    alt={user?.fullname}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <div className="font-semibold text-foreground">
                                                    {user?.fullname}
                                                </div>
                                            </div>

                                            <textarea
                                                className="w-full p-3 text-sm border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Share your thoughts..."
                                                value={newComment.content}
                                                onChange={(e) =>
                                                    setNewComment({
                                                        content: e.target.value,
                                                    })
                                                }
                                                rows={3}
                                            />

                                            <div className="flex justify-between items-center">
                                                <div className="text-xs text-gray-500">
                                                    Press Ctrl+Enter to submit
                                                </div>
                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    disabled={
                                                        !newComment.content.trim()
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            newComment.content.trim() &&
                                                            user
                                                        ) {
                                                            const comment = {
                                                                id: Date.now(),
                                                                task_id:
                                                                    targetTask.id,
                                                                author: {
                                                                    id: user.id,
                                                                    fullname:
                                                                        user.fullname,
                                                                    avatarurl:
                                                                        user.avatarUrl ||
                                                                        "",
                                                                    email: user.email,
                                                                },
                                                                text: newComment.content,
                                                                timestamp:
                                                                    new Date().toLocaleString(),
                                                            };
                                                            setTargetTask({
                                                                ...targetTask,
                                                                comments: [
                                                                    ...(targetTask.comments ||
                                                                        []),
                                                                    comment,
                                                                ],
                                                            });
                                                            setNewComment({
                                                                content: "",
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add Comment
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Board;
