import { Search, Calendar, Users, CheckCircle } from "lucide-react";
import { useGetBoards } from "@/features/boards/lib/useGetBoards";

const Dashboard = () => {
    const { data: boards } = useGetBoards();

    return (
        <div className="flex-1 p-6 bg-background min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Taskboard Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Manage and track your project taskboards
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Taskboards
                            </p>
                            <p className="text-2xl font-bold text-card-foreground">
                                {boards?.length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Favorite boards
                            </p>
                            <p className="text-2xl font-bold text-card-foreground">
                                {boards?.reduce(
                                    (sum, board) => +sum + +board.favorite,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-chart-1/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-chart-1" />
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Tasks
                            </p>
                            <p className="text-2xl font-bold text-card-foreground">
                                {boards?.reduce(
                                    (sum, board) => +sum + +board.tasks_count,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-chart-2" />
                        </div>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Team Members
                            </p>
                            <p className="text-2xl font-bold text-card-foreground">
                                {boards?.reduce(
                                    (sum, board) =>
                                        +sum + +board.member_count - 1,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-chart-5/20 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-chart-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Taskboards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boards?.map((board) => {
                    return (
                        <div
                            key={board.id}
                            className="bg-card rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-border group hover:border-border/80"
                        >
                            <div className="p-6">
                                {/* Board Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-4 h-4 rounded-full opacity-80 group-hover:opacity-100 transition-opacity`}
                                            style={{
                                                backgroundColor:
                                                    board.color_accent,
                                            }}
                                        ></div>
                                        <h3 className="text-lg font-semibold text-card-foreground">
                                            {board.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                    {board.description}
                                </p>

                                {/* Stats */}
                                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{board.member_count}</span>
                                    </div>
                                </div>

                                {/* Last Updated */}
                                <div className="text-xs text-muted-foreground">
                                    Last updated{" "}
                                    {new Date(
                                        board.last_updated
                                    ).toDateString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* No Results */}
            {boards?.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-card-foreground mb-2">
                        No taskboards found
                    </h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search terms or create a new
                        taskboard.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
