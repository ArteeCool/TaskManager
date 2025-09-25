import { Plus } from "lucide-react";

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

export default AddTaskForm;
