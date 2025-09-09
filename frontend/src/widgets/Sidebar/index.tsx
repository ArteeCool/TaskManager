import { useUser } from "@/features/auth/lib/useUser";
import { Settings, LayoutDashboard, SquareKanban } from "lucide-react";
import { Link } from "react-router";

const Sidebar = () => {
    const { user } = useUser();

    return (
        <div className="sticky top-[var(--header-height)] left-0 h-[calc(100vh-var(--header-height))] w-84 bg-background border-r border-border flex flex-col">
            <div className="p-6 border-b border-border">
                {user && (
                    <h2 className="text-xl font-semibold text-foreground">
                        Hi, {user.fullname}!
                    </h2>
                )}
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    <li>
                        <Link
                            to="/app/dashboard"
                            className="flex items-center px-4 py-3 text-foreground rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                        >
                            <LayoutDashboard className="w-5 h-5 mr-3" />
                            <span>Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/app/boards"
                            className="flex items-center px-4 py-3 text-foreground rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                        >
                            <SquareKanban className="w-5 h-5 mr-3" />
                            <span>Boards</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-100">
                <Link
                    to="/settings"
                    className="flex items-center px-4 py-3 text-foreground rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                >
                    <Settings className="w-5 h-5 mr-3" />
                    <span>Settings</span>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;
