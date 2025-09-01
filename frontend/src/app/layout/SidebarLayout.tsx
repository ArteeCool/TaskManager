import { Outlet } from "react-router";
import Sidebar from "@/widgets/Sidebar";

const DashboardLayout = () => {
    return (
        <div className="flex min-h-[calc(100vh-var(--header-height))]">
            <Sidebar />
            <main className="flex-1 p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
