const Loader = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>

                <p className="text-gray-600 font-medium">Loading...</p>
            </div>
        </div>
    );
};

export default Loader;
