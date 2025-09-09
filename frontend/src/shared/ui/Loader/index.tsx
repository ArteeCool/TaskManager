const Loader = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background z-[100] fixed top-0 left-0 w-full h-full">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>

                <p className="text-foreground text-lg font-medium">
                    Loading...
                </p>
            </div>
        </div>
    );
};

export default Loader;
