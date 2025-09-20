const NotFoundPage = () => {
    return (
        <div className="flex-1 bg-background flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-foreground mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-foreground/50 mb-4">
                    Page Not Found
                </h2>
                <p className="text-foreground/60 mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
