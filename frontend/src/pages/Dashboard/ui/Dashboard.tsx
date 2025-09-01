import { useState } from "react";
import { Search, Plus, Calendar, Users, CheckCircle } from "lucide-react";

const Dashboard = () => {
    const [searchTerm, setSearchTerm] = useState("");

    // Mock taskboard data with custom colors matching your design system
    const [taskboards] = useState([
        {
            id: 1,
            name: "Website Redesign",
            description: "Complete overhaul of company website",
            tasks: 12,
            completed: 8,
            members: 5,
            lastUpdated: "2 hours ago",
            color: "bg-primary-500",
        },
        {
            id: 2,
            name: "Mobile App Development",
            description: "iOS and Android app for customer portal",
            tasks: 24,
            completed: 15,
            members: 8,
            lastUpdated: "1 day ago",
            color: "bg-chart-2",
        },
        {
            id: 3,
            name: "Marketing Campaign Q4",
            description: "Holiday season marketing initiatives",
            tasks: 18,
            completed: 6,
            members: 4,
            lastUpdated: "3 hours ago",
            color: "bg-chart-1",
        },
        {
            id: 4,
            name: "Bug Fixes Sprint",
            description: "Critical bug fixes for production",
            tasks: 8,
            completed: 7,
            members: 3,
            lastUpdated: "30 minutes ago",
            color: "bg-destructive",
        },
        {
            id: 5,
            name: "User Research",
            description: "Customer feedback and usability testing",
            tasks: 6,
            completed: 4,
            members: 2,
            lastUpdated: "1 week ago",
            color: "bg-chart-5",
        },
    ]);

    // Filter taskboards based on search term
    const filteredTaskboards = taskboards.filter(
        (board) =>
            board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            board.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateProgress = (completed: number, total: number) => {
        return Math.round((completed / total) * 100);
    };

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

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search taskboards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                    <Plus className="w-5 h-5" />
                    New Taskboard
                </button>
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
                                {taskboards.length}
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
                                Total Tasks
                            </p>
                            <p className="text-2xl font-bold text-card-foreground">
                                {taskboards.reduce(
                                    (sum, board) => sum + board.tasks,
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
                                Completed Tasks
                            </p>
                            <p className="text-2xl font-bold text-card-foreground">
                                {taskboards.reduce(
                                    (sum, board) => sum + board.completed,
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
                                Team Members
                            </p>
                            <p className="text-2xl font-bold text-card-foreground">
                                {taskboards.reduce(
                                    (sum, board) => sum + board.members,
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
                {filteredTaskboards.map((board) => {
                    const progress = calculateProgress(
                        board.completed,
                        board.tasks
                    );

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
                                            className={`w-4 h-4 rounded-full ${board.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                                        ></div>
                                        <h3 className="text-lg font-semibold text-card-foreground">
                                            {board.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                    {board.description}
                                </p>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">
                                            Progress
                                        </span>
                                        <span className="text-sm font-medium text-card-foreground">
                                            {progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${board.color} transition-all duration-300 ease-in-out`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                                    <span>
                                        {board.completed}/{board.tasks} tasks
                                        completed
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{board.members}</span>
                                    </div>
                                </div>

                                {/* Last Updated */}
                                <div className="text-xs text-muted-foreground">
                                    Last updated {board.lastUpdated}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* No Results */}
            {filteredTaskboards.length === 0 && (
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
