import { useState, useMemo, useEffect } from "react";
import {
    Search,
    Plus,
    Users,
    Calendar,
    Clock,
    MoreHorizontal,
} from "lucide-react";
import { useLoader } from "@/features/loader/lib/useLoader";
import { useGetBoards } from "@/features/boards/lib/useGetBoards";
import { Link } from "react-router";

const Boards = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;
    const { startLoading, finishLoading } = useLoader();
    const { data, isLoading } = useGetBoards();

    useEffect(() => {
        if (isLoading) {
            startLoading("boards");
        } else {
            finishLoading("boards");
        }
    }, [isLoading, startLoading, finishLoading]);

    const filteredBoards = useMemo(() => {
        if (!data) return [];

        let filtered = data;

        if (searchTerm) {
            filtered = filtered.filter(
                (board) =>
                    board.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    board.description
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
        }

        if (selectedFilter === "favorites") {
            filtered = filtered.filter((board) => board.favorite);
        }

        return filtered;
    }, [data, searchTerm, selectedFilter]);

    const totalPages = Math.ceil(filteredBoards.length / itemsPerPage);
    const currentBoards = filteredBoards.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="flex-1 bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Boards</h1>
                    <p className="text-muted-foreground">
                        Organize your projects with Kanban boards
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search boards..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setSelectedFilter("all");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedFilter === "all"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                            }`}
                        >
                            All Boards
                        </button>
                        <button
                            onClick={() => {
                                setSelectedFilter("favorites");
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedFilter === "favorites"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                            }`}
                        >
                            Favorites
                        </button>
                        <Link to={"/create-board/"}>
                            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                New Board
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Boards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentBoards.map((board) => (
                        <Link to={`/board/${board.id}`} key={board.id}>
                            <div
                                key={board.id}
                                className={`group relative rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105`}
                                style={{
                                    backgroundColor: board.color_background,
                                }}
                            >
                                {/* Color accent bar */}
                                <div
                                    className={`absolute top-0 left-0 w-full h-1 rounded-t-lg`}
                                    style={{
                                        backgroundColor: board.color_accent,
                                    }}
                                />

                                {/* Board header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                            {board.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm line-clamp-2">
                                            {board.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {board.favorite && (
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                                        )}
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{board.member_count}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{board.tasks_count}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs">
                                            {new Date(
                                                board.last_updated
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty state */}
                {filteredBoards.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            No boards found
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {searchTerm
                                ? `No boards match "${searchTerm}". Try a different search term.`
                                : selectedFilter === "favorites"
                                ? "You haven't favorited any boards yet."
                                : "Create your first board to get started."}
                        </p>
                        <Link to={"/create-board/"}>
                            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto">
                                <Plus className="w-4 h-4" />
                                Create New Board
                            </button>
                        </Link>
                    </div>
                )}

                {/* Stats summary */}
                {filteredBoards.length > 0 && (
                    <div className="mt-8 text-center text-muted-foreground">
                        <p className="text-sm">
                            Showing {currentBoards.length} of{" "}
                            {filteredBoards.length} boards
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {filteredBoards.length > itemsPerPage && (
                    <div className="mt-6 flex justify-center gap-4">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                page === 1
                                    ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed"
                                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                            }`}
                        >
                            Previous
                        </button>
                        <span className="text-sm flex items-center">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                page === totalPages
                                    ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed"
                                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                            }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Boards;
