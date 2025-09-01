import { logOut } from "@/features/auth/api/logOut";
import { useUser } from "@/features/auth/lib/useUser";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/shared/ui/DropdownMenu";
import {
    LayoutDashboard,
    LogOut,
    Settings,
    SquareKanban,
    UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useResolvedPath } from "react-router";

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const path = useResolvedPath("");
    const { user } = useUser();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
            console.log(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    });

    const baseClasses =
        "bg-background border-b border-transparent h-24 sticky top-0 transition-all z-50";

    const activeClasses = "border-b-2 border-border";

    return (
        <div className={cn(baseClasses, { [activeClasses]: isScrolled })}>
            <div className="mx-auto px-6 max-w-7xl flex items-center justify-between h-full">
                <Link to={"/"}>
                    <div className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                        <span className="">Task</span>
                        <SquareKanban className="w-8 h-8" />
                        <span>Manager</span>
                    </div>
                </Link>
                {path.pathname === "/"}
                {!user?.id && (
                    <ul className="flex items-center gap-2">
                        <li>
                            <Link to="/log-in">
                                <Button size="small" variant="primary">
                                    Log In
                                </Button>
                            </Link>
                        </li>
                        <li>
                            <Link to="/sign-up">
                                <Button size="small" variant="default">
                                    Sign Up
                                </Button>
                            </Link>
                        </li>
                    </ul>
                )}
                {user?.id && (
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <img
                                    className="w-full h-full object-cover"
                                    src={user.avatarurl}
                                    alt="avatar"
                                />
                            </div>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-64">
                            <DropdownMenuLabel>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.avatarurl}
                                        alt="avatar"
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">
                                            {user.fullname}
                                        </span>
                                        <span className="text-xs text-foreground/50 truncate">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <Link to={`/profile/${user.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    Profile
                                </DropdownMenuItem>
                            </Link>

                            <Link to="/app/dashboard">
                                <DropdownMenuItem className="cursor-pointer">
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    Dashboard
                                </DropdownMenuItem>
                            </Link>

                            <Link to="/app/settings">
                                <DropdownMenuItem className="cursor-pointer">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                            </Link>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                onClick={async () => {
                                    await logOut();
                                    document.dispatchEvent(new Event("logout"));
                                }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
};

export default Header;
