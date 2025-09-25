import { Plus } from "lucide-react";

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

export default AddListSection;
