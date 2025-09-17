import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "../layout";
import { ProtectedRoute } from "@/app/routes/ProtectedRoute";
import {
    Boards,
    Dashboard,
    EmailConfirmation,
    ForgotPassword,
    Home,
    LogIn,
    Profile,
    ResetPassword,
    SignUp,
} from "@/pages";
import SidebarLayout from "../layout/SidebarLayout";
import CreateBoard from "@/pages/CreateBoard/ui";
import Board from "@/pages/Board/ui";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "log-in", element: <LogIn /> },
            { path: "sign-up", element: <SignUp /> },
            { path: "profile/:id", element: <Profile /> },
            { path: "email-confirmation", element: <EmailConfirmation /> },
            { path: "forgot-password", element: <ForgotPassword /> },
            { path: "reset-password/:token", element: <ResetPassword /> },
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
                            {
                                path: "boards",
                                element: <Boards />,
                            },
                        ],
                    },
                    {
                        path: "create-board",
                        element: <CreateBoard />,
                    },
                    {
                        path: "board/:id",
                        element: <Board />,
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
