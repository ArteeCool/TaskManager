import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { useGetBoardData } from "@/features/boards/lib/useBoardData";
import { useNavigate, useParams } from "react-router";
import type {
    BoardResponse,
    BoardWithListsResponse,
    Comment,
    ListRequest,
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
    useCreateComment,
    useDeleteComment,
} from "@/features/boards/lib/hooks";
import { socket } from "@/features/boards/lib/socket";
import BoardHeaderWithMembers from "./BoardHeaderWithMembers";
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Input,
} from "@/shared/ui";
import { useUser } from "@/features/auth/lib/useUser";
import ListHeader from "./ListHeader";
import TaskItem from "./TaskItem";
import AddTaskForm from "./AddTaskForm";
import AddListSection from "./AddListSection";
import CommentCard from "./CommentCard";
import AssigneesField from "./AssigneesField";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { User } from "@/features/auth/model/types";

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
    const [addingTaskToList, setAddingTaskToList] = useState<number | null>(
        null
    );
    const [newComment, setNewComment] = useState({ content: "" });
    const [membersModalOpen, setMembersModalOpen] = useState(false);

    const [dragState, setDragState] = useState({
        draggingTask: null as Task | null,
        sourceListId: null as number | null,
        targetListId: null as number | null,
        targetIndex: null as number | null,
        isOverEmptyList: false,
    });

    const [listDragState, setListDragState] = useState({
        draggingList: null as ListWithTasks | null,
        sourceIndex: null as number | null,
        targetIndex: null as number | null,
    });

    const newListInputRef = useRef<HTMLInputElement>(null);
    const editListInputRef = useRef<HTMLInputElement>(null);
    const newTaskInputRef = useRef<HTMLInputElement>(null);

    const createListMutation = useCreateList();
    const updateListMutation = useUpdateList();
    const deleteListMutation = useDeleteList();
    const createTaskMutation = useCreateTask();
    const updateTaskMutation = useBatchUpdateTasks();
    const deleteTaskMutation = useDeleteTask();

    const createComment = useCreateComment();
    const deleteComment = useDeleteComment();

    const handleDeleteComment = (commentId: number) => {
        deleteComment.mutate(commentId);
    };

    const handleTaskDragStart = useCallback(
        (e: React.DragEvent<HTMLDivElement>, task: Task, listId: number) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData(
                "text/plain",
                JSON.stringify({ taskId: task.id, listId })
            );

            setDragState((prev) => ({
                ...prev,
                draggingTask: task,
                sourceListId: listId,
            }));
        },
        []
    );

    const handleTaskDragOver = useCallback(
        (
            e: React.DragEvent<HTMLDivElement>,
            listId: number,
            taskIndex: number = -1
        ) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";

            setDragState((prev) => ({
                ...prev,
                targetListId: listId,
                targetIndex: taskIndex,
                isOverEmptyList: taskIndex === -1,
            }));
        },
        []
    );

    const handleTaskDragLeave = useCallback(() => {
        setDragState((prev) => ({
            ...prev,
            targetListId: null,
            targetIndex: null,
            isOverEmptyList: false,
        }));
    }, []);

    const handleTaskDrop = useCallback(
        (
            e: React.DragEvent<HTMLDivElement>,
            targetListId: number,
            targetIndex: number = -1
        ) => {
            e.preventDefault();

            const { draggingTask, sourceListId } = dragState;
            if (!draggingTask || sourceListId == null) {
                setDragState({
                    draggingTask: null,
                    sourceListId: null,
                    targetListId: null,
                    targetIndex: null,
                    isOverEmptyList: false,
                });
                return;
            }

            setCurrentBoardData((prev) => {
                if (!prev) return prev;

                const lists = prev.lists.map((l) => ({
                    ...l,
                    tasks: [...l.tasks],
                }));

                const sourceListIndex = lists.findIndex(
                    (l) => l.id === sourceListId
                );
                const targetListIndex = lists.findIndex(
                    (l) => l.id === targetListId
                );
                if (sourceListIndex === -1 || targetListIndex === -1)
                    return prev;

                const sourceList = lists[sourceListIndex];
                const targetList = lists[targetListIndex];

                const draggedIndex = sourceList.tasks.findIndex(
                    (t) => t.id === draggingTask.id
                );
                if (draggedIndex === -1) return prev;

                const insertIndex =
                    targetIndex === -1 ? targetList.tasks.length : targetIndex;

                if (sourceListId === targetListId) {
                    const targetTask = targetList.tasks[insertIndex];
                    if (!targetTask) return prev;

                    [
                        sourceList.tasks[draggedIndex],
                        sourceList.tasks[insertIndex],
                    ] = [
                        sourceList.tasks[insertIndex],
                        sourceList.tasks[draggedIndex],
                    ];

                    sourceList.tasks = sourceList.tasks.map((t, idx) => ({
                        ...t,
                        position: idx,
                    }));

                    updateTaskMutation.mutate([
                        {
                            id: sourceList.tasks[draggedIndex].id,
                            position: draggedIndex,
                            list_id: sourceListId,
                        },
                        {
                            id: sourceList.tasks[insertIndex].id,
                            position: insertIndex,
                            list_id: sourceListId,
                        },
                    ]);
                } else {
                    const [removedTask] = sourceList.tasks.splice(
                        draggedIndex,
                        1
                    );
                    removedTask.list_id = targetListId;
                    targetList.tasks.splice(insertIndex, 0, removedTask);

                    sourceList.tasks = sourceList.tasks.map((t, idx) => ({
                        ...t,
                        position: idx,
                    }));
                    targetList.tasks = targetList.tasks.map((t, idx) => ({
                        ...t,
                        position: idx,
                    }));

                    const tasksToUpdate = [
                        ...sourceList.tasks.map((t) => ({
                            id: t.id,
                            position: t.position,
                            list_id: sourceList.id,
                        })),
                        ...targetList.tasks.map((t) => ({
                            id: t.id,
                            position: t.position,
                            list_id: targetList.id,
                        })),
                    ];
                    updateTaskMutation.mutate(tasksToUpdate);
                }

                lists[sourceListIndex] = sourceList;
                lists[targetListIndex] = targetList;

                return { ...prev, lists };
            });

            setDragState({
                draggingTask: null,
                sourceListId: null,
                targetListId: null,
                targetIndex: null,
                isOverEmptyList: false,
            });
        },
        [dragState, updateTaskMutation]
    );

    useEffect(() => {
        if (isError) navigate("/404");
    }, [isError, navigate]);

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
        if (addingTaskToList) newTaskInputRef.current?.focus();
    }, [addingTaskToList]);

    useEffect(() => {
        socket.connect();
        socket.emit("joinBoard", boardId);

        const mergeTask = (existing: Task | undefined, incoming: Task) => ({
            ...existing,
            ...incoming,
            comments: incoming.comments ?? existing?.comments ?? [],
            assignees: incoming.assignees ?? existing?.assignees ?? [],
        });

        const socketHandlers = {
            taskCreated: (newTask: Task) => {
                setCurrentBoardData((prev) =>
                    prev
                        ? {
                              ...prev,
                              lists: prev.lists.map((list) =>
                                  list.id === newTask.list_id
                                      ? {
                                            ...list,
                                            tasks: [...list.tasks, newTask],
                                        }
                                      : list
                              ),
                          }
                        : prev
                );
            },

            tasksUpdated: (updatedTasks: Task[]) => {
                setCurrentBoardData((prev) => {
                    if (!prev) return prev;

                    const listMap = new Map(
                        prev.lists.map((l) => [l.id, { ...l }])
                    );

                    updatedTasks.forEach((task) => {
                        const targetList = listMap.get(task.list_id);
                        if (!targetList) return;

                        const existingIndex = targetList.tasks.findIndex(
                            (t) => t.id === task.id
                        );
                        if (existingIndex >= 0) {
                            targetList.tasks[existingIndex] = mergeTask(
                                targetList.tasks[existingIndex],
                                task
                            );
                        } else {
                            targetList.tasks.push(mergeTask(undefined, task));
                        }
                    });

                    return { ...prev, lists: Array.from(listMap.values()) };
                });
                setTargetTask((prev) => {
                    if (!prev) return null;
                    const updated = updatedTasks.find((t) => t.id === prev.id);
                    return updated ? mergeTask(prev, updated) : prev;
                });
            },

            taskDeleted: ({
                taskId,
                listId,
            }: {
                taskId: number;
                listId: number;
            }) => {
                setCurrentBoardData((prev) =>
                    prev
                        ? {
                              ...prev,
                              lists: prev.lists.map((list) =>
                                  list.id === listId
                                      ? {
                                            ...list,
                                            tasks: list.tasks.filter(
                                                (t) => t.id !== taskId
                                            ),
                                        }
                                      : list
                              ),
                          }
                        : prev
                );

                if (targetTask?.id === taskId) setTargetTask(null);
            },

            listCreated: (newList: ListWithTasks) => {
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
            },

            listUpdated: (updatedList: ListWithTasks) => {
                setCurrentBoardData((prev) =>
                    prev
                        ? {
                              ...prev,
                              lists: prev.lists
                                  .map((list) =>
                                      list.id === updatedList.id
                                          ? {
                                                ...list,
                                                ...updatedList,
                                                tasks:
                                                    updatedList.tasks ||
                                                    list.tasks,
                                            }
                                          : list
                                  )
                                  .sort(
                                      (a, b) =>
                                          (a.position ?? 0) - (b.position ?? 0)
                                  ),
                          }
                        : prev
                );
            },

            listDeleted: (deletedListId: number) => {
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
            },

            commentCreated: (newComment: Comment) => {
                setCurrentBoardData((prev) =>
                    prev
                        ? {
                              ...prev,
                              lists: prev.lists.map((list) => ({
                                  ...list,
                                  tasks: list.tasks.map((task) =>
                                      task.id === newComment.task_id
                                          ? {
                                                ...task,
                                                comments: [
                                                    ...(task.comments || []),
                                                    newComment,
                                                ],
                                            }
                                          : task
                                  ),
                              })),
                          }
                        : prev
                );

                setTargetTask((prev) =>
                    prev?.id === newComment.task_id
                        ? {
                              ...prev,
                              comments: [...(prev.comments || []), newComment],
                          }
                        : prev
                );
            },

            commentDeleted: (deletedCommentId: number) => {
                setCurrentBoardData((prev) =>
                    prev
                        ? {
                              ...prev,
                              lists: prev.lists.map((list) => ({
                                  ...list,
                                  tasks: list.tasks.map((task) => ({
                                      ...task,
                                      comments: (task.comments || []).filter(
                                          (c) => c.id !== deletedCommentId
                                      ),
                                  })),
                              })),
                          }
                        : prev
                );

                setTargetTask((prev) =>
                    prev
                        ? {
                              ...prev,
                              comments: (prev.comments || []).filter(
                                  (c) => c.id !== deletedCommentId
                              ),
                          }
                        : prev
                );
            },
        };

        Object.entries(socketHandlers).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        return () => {
            Object.keys(socketHandlers).forEach((event) => {
                socket.off(event);
            });
            socket.disconnect();
        };
    }, [boardId]);

    const handleAddList = (title: string) => {
        if (!title.trim()) return;
        createListMutation.mutate(
            { board_id: boardId, title: title.trim() },
            { onSuccess: () => setIsAddingList(false) }
        );
    };

    const handleUpdateList = (data: Partial<ListRequest>) => {
        if (!data) return;
        updateListMutation.mutate(data, {
            onSuccess: () => setEditingList(null),
        });
    };

    const handleDeleteList = (listId: number) => {
        deleteListMutation.mutate(listId);
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
            { onSuccess: () => setAddingTaskToList(null) }
        );
    };

    const handleUpdateTask = (
        taskId: number,
        payload: Partial<TaskRequest>
    ) => {
        updateTaskMutation.mutate([{ id: taskId, ...payload }]);
    };

    const handleDeleteTask = (taskId: number) => {
        deleteTaskMutation.mutate(taskId);
    };

    const handleAddComment = () => {
        if (newComment.content.trim() && user && targetTask) {
            createComment.mutate(
                { taskId: targetTask.id, content: newComment.content.trim() },
                { onSuccess: () => setNewComment({ content: "" }) }
            );
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            handleAddComment();
        }
    };

    const handleListDragStart = useCallback(
        (
            e: React.DragEvent<HTMLDivElement>,
            list: ListWithTasks,
            index: number
        ) => {
            if (dragState.draggingTask) return;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData(
                "text/plain",
                JSON.stringify({ listId: list.id })
            );
            setListDragState({
                draggingList: list,
                sourceIndex: index,
                targetIndex: index,
            });
        },
        [dragState.draggingTask]
    );

    const handleListDragOver = useCallback(
        (e: React.DragEvent<HTMLDivElement>, hoverIndex: number) => {
            if (dragState.draggingTask) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setListDragState((prev) => ({ ...prev, targetIndex: hoverIndex }));
        },
        [dragState.draggingTask]
    );

    const handleListDragLeave = useCallback(() => {
        setListDragState((prev) => ({ ...prev }));
    }, []);

    const handleListDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (dragState.draggingTask) return;
            e.preventDefault();
            setCurrentBoardData((prev) => {
                if (!prev || listDragState.draggingList == null) return prev;
                const lists = [...prev.lists];
                const { sourceIndex, targetIndex } = listDragState;
                if (
                    sourceIndex == null ||
                    targetIndex == null ||
                    sourceIndex === targetIndex
                )
                    return prev;

                [lists[sourceIndex], lists[targetIndex]] = [
                    lists[targetIndex],
                    lists[sourceIndex],
                ];

                const updated = lists.map((l, idx) => ({
                    ...l,
                    position: idx,
                }));

                updated.forEach((l) =>
                    updateListMutation.mutate({
                        id: l.id,
                        position: l.position,
                    })
                );

                return { ...prev, lists: updated };
            });

            setListDragState({
                draggingList: null,
                sourceIndex: null,
                targetIndex: null,
            });
        },
        [listDragState, updateListMutation, dragState.draggingTask]
    );

    return (
        <div className="flex-1 bg-background p-4 md:p-6">
            <div className="max-w-full mx-auto">
                {currentBoardData.board && (
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold">
                            {currentBoardData.board.title}
                        </h1>

                        <Button
                            variant="primary"
                            onClick={() => setMembersModalOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Members
                        </Button>
                    </div>
                )}

                {boardData?.board && (
                    <BoardHeaderWithMembers
                        boardData={currentBoardData.board}
                        members={currentBoardData.members as User[]}
                        isOpen={membersModalOpen}
                        onClose={() => setMembersModalOpen(false)}
                    />
                )}

                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 min-h-[600px] mt-6">
                    <LayoutGroup>
                        {currentBoardData.lists.map((list, index) => (
                            <div key={list.id} className="flex-shrink-0">
                                <motion.div
                                    layout
                                    className={`w-72 md:w-80 bg-card rounded-xl shadow-lg border ${
                                        listDragState.targetIndex === index
                                            ? "ring-2 ring-primary-500"
                                            : ""
                                    }`}
                                    style={{
                                        opacity:
                                            listDragState.draggingList?.id ===
                                            list.id
                                                ? 0.4
                                                : 1,
                                        transform: `scale(${
                                            listDragState.draggingList?.id ===
                                            list.id
                                                ? 1.05
                                                : 1
                                        })`,
                                    }}
                                >
                                    <div className="flex-shrink-0 w-72 md:w-80 bg-card dark:bg-card rounded-xl shadow-lg border border-border transition-all duration-200">
                                        <ListHeader
                                            list={list}
                                            editingList={editingList}
                                            setEditingList={setEditingList}
                                            handleUpdateList={handleUpdateList}
                                            handleDeleteList={handleDeleteList}
                                            editListInputRef={editListInputRef}
                                            onDragStart={(e) =>
                                                handleListDragStart(
                                                    e,
                                                    list,
                                                    index
                                                )
                                            }
                                            onDragOver={(e) =>
                                                handleListDragOver(e, index)
                                            }
                                            onDragLeave={handleListDragLeave}
                                            onDrop={handleListDrop}
                                            isDraggingOver={
                                                listDragState.targetIndex ===
                                                index
                                            }
                                            index={index}
                                        />

                                        <div
                                            className="p-2 space-y-2 min-h-[75px]"
                                            onDragOver={(e) =>
                                                handleTaskDragOver(
                                                    e,
                                                    list.id,
                                                    -1
                                                )
                                            }
                                            onDragLeave={handleTaskDragLeave}
                                            onDrop={(e) =>
                                                handleTaskDrop(e, list.id, -1)
                                            }
                                        >
                                            <AnimatePresence>
                                                {list.tasks
                                                    .sort(
                                                        (a, b) =>
                                                            a.position -
                                                            b.position
                                                    )
                                                    .map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className="relative"
                                                        >
                                                            <motion.div
                                                                key={task.id}
                                                                layoutId={`task-${task.id}`}
                                                                layout
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 500,
                                                                    damping: 40,
                                                                }}
                                                                style={{
                                                                    opacity:
                                                                        dragState
                                                                            .draggingTask
                                                                            ?.id ===
                                                                        task.id
                                                                            ? 0.4
                                                                            : 1,
                                                                    transform: `scale(${
                                                                        dragState
                                                                            .draggingTask
                                                                            ?.id ===
                                                                        task.id
                                                                            ? 1.05
                                                                            : 1
                                                                    })`,
                                                                }}
                                                            >
                                                                <TaskItem
                                                                    task={task}
                                                                    listId={
                                                                        list.id
                                                                    }
                                                                    handleDeleteTask={
                                                                        handleDeleteTask
                                                                    }
                                                                    handleDragStart={
                                                                        handleTaskDragStart
                                                                    }
                                                                    handleDragOver={
                                                                        handleTaskDragOver
                                                                    }
                                                                    handleDragLeave={
                                                                        handleTaskDragLeave
                                                                    }
                                                                    handleDrop={
                                                                        handleTaskDrop
                                                                    }
                                                                    isDragged={
                                                                        dragState
                                                                            .draggingTask
                                                                            ?.id ===
                                                                        task.id
                                                                    }
                                                                    setTargetTask={
                                                                        setTargetTask
                                                                    }
                                                                />
                                                            </motion.div>
                                                        </div>
                                                    ))}
                                            </AnimatePresence>
                                        </div>

                                        <div className="p-3 border-t border-border bg-muted dark:bg-muted rounded-b-xl">
                                            <AddTaskForm
                                                listId={list.id}
                                                addingTaskToList={
                                                    addingTaskToList
                                                }
                                                setAddingTaskToList={
                                                    setAddingTaskToList
                                                }
                                                handleAddTask={handleAddTask}
                                                newTaskInputRef={
                                                    newTaskInputRef
                                                }
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </LayoutGroup>

                    <AddListSection
                        isAddingList={isAddingList}
                        setIsAddingList={setIsAddingList}
                        handleAddList={handleAddList}
                        newListInputRef={newListInputRef}
                    />
                </div>

                <Dialog
                    open={!!targetTask}
                    onOpenChange={(open) => {
                        if (!open && targetTask) {
                            handleUpdateTask(targetTask.id, {
                                title: targetTask.title,
                            });
                        }
                        setTargetTask(null);
                        setNewComment({ content: "" });
                    }}
                >
                    <DialogContent className="!max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader className="border-b border-border pb-4">
                            <DialogTitle className="text-xl font-semibold">
                                Task Details
                            </DialogTitle>
                        </DialogHeader>

                        {targetTask && (
                            <div className="flex-1 overflow-y-auto space-y-6 py-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                            Title
                                        </label>
                                        <Input
                                            value={targetTask.title}
                                            onChange={(e) =>
                                                setTargetTask({
                                                    ...targetTask,
                                                    title: e.target.value,
                                                })
                                            }
                                            className="text-lg font-medium"
                                        />
                                    </div>

                                    <AssigneesField
                                        targetTask={targetTask}
                                        boardData={currentBoardData}
                                        handleUpdateTask={handleUpdateTask}
                                    />
                                </div>

                                <div className="border-t border-border pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5" />
                                            Comments
                                            {targetTask.comments &&
                                                targetTask.comments.length >
                                                    0 && (
                                                    <span className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 text-sm px-2 py-1 rounded-full">
                                                        {
                                                            targetTask.comments
                                                                .length
                                                        }
                                                    </span>
                                                )}
                                        </h3>
                                    </div>

                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                        {targetTask.comments?.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">
                                                    No comments yet
                                                </p>
                                            </div>
                                        ) : (
                                            targetTask.comments?.map(
                                                (comment) => (
                                                    <CommentCard
                                                        key={comment.id}
                                                        comment={comment}
                                                        onDelete={() =>
                                                            handleDeleteComment(
                                                                comment.id
                                                            )
                                                        }
                                                        canDelete={
                                                            comment.author
                                                                ?.id ===
                                                            user?.id
                                                        }
                                                    />
                                                )
                                            )
                                        )}
                                    </div>

                                    <div className="mt-6 p-4 bg-muted dark:bg-muted rounded-lg">
                                        <div className="flex gap-3">
                                            <img
                                                src={user?.avatarurl}
                                                alt={user?.fullname}
                                                className="w-8 h-8 rounded-full flex-shrink-0"
                                            />
                                            <div className="flex-1">
                                                <textarea
                                                    className="w-full p-3 text-sm border border-input rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
                                                    placeholder="Write a comment..."
                                                    value={newComment.content}
                                                    onChange={(e) =>
                                                        setNewComment({
                                                            content:
                                                                e.target.value,
                                                        })
                                                    }
                                                    onKeyDown={handleKeyPress}
                                                    rows={3}
                                                />
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        Ctrl + Enter to submit
                                                    </span>
                                                    <Button
                                                        onClick={
                                                            handleAddComment
                                                        }
                                                        disabled={
                                                            !newComment.content.trim()
                                                        }
                                                        className="bg-primary-600 hover:bg-primary-700 text-primary-foreground"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Add Comment
                                                    </Button>
                                                </div>
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
