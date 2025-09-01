const Footer = () => {
    return (
        <footer className="h-32 bg-background border-t border-border flex flex-col justify-center items-center px-12 py-6 gap-6">
            <div className="flex gap-8">
                <a
                    href="https://www.linkedin.com/in/artemhavryliuk/"
                    className="text-foreground/70 hover:text-foreground transition-colors"
                >
                    LinkedIn
                </a>
                <a
                    href="https://github.com/ArteeCool"
                    className="text-foreground/70 hover:text-foreground transition-colors"
                >
                    GitHub
                </a>
            </div>

            <div className="text-foreground/70 text-sm">
                © {new Date().getFullYear()} Task Manager. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
