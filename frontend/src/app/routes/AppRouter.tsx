import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "../layout";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { Dashboard, Home, LogIn, Profile, SignUp } from "@/pages";
import SidebarLayout from "../layout/SidebarLayout";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "log-in", element: <LogIn /> },
            { path: "sign-up", element: <SignUp /> },
            { path: "profile/:id", element: <Profile /> },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "app",
                        element: <SidebarLayout />,
                        children: [
                            {
                                path: "dashboard",
                                element: <Dashboard />,
                            },
                        ],
                    },
                ],
            },
        ],
    },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;
