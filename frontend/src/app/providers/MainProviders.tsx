import { Toaster } from "@/shared/ui/Sooner";
import AuthProvider from "./AuthProvider";
import LoaderProvider from "./LoaderProvider";
import { QueryProvider } from "./QueryProvider";

interface MainProvidersProps {
    children: React.ReactNode;
}

const MainProviders = ({ children }: MainProvidersProps) => {
    return (
        <>
            <Toaster />
            <QueryProvider>
                <LoaderProvider>
                    <AuthProvider>{children}</AuthProvider>
                </LoaderProvider>
            </QueryProvider>
        </>
    );
};

export default MainProviders;
