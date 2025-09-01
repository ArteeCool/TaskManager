import { useLoader } from "@/features/loader/lib/useLoader";
import { Loader } from "@/shared/ui";
import { Footer } from "@/widgets/Footer";
import { Header } from "@/widgets/Header";
import { useEffect } from "react";
import { Outlet } from "react-router";

const Layout = () => {
    const { loadings, startLoading, finishLoading } = useLoader();

    useEffect(() => {
        const loadFonts = async () => {
            startLoading("fonts");
            await document.fonts.load('1rem "Geist Mono"');
            finishLoading("fonts");
        };

        loadFonts();
    }, [finishLoading, startLoading]);

    useEffect(() => {
        document.body.classList.add("dark");
    }, []);

    return (
        <>
            {loadings.size > 0 ? (
                <Loader />
            ) : (
                <div
                    className="min-h-screen flex flex-col font-geist-mono"
                    id="layout"
                >
                    <Header />
                    <Outlet />
                    <Footer />
                </div>
            )}
        </>
    );
};

export default Layout;
