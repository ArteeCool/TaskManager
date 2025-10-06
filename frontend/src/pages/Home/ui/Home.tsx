import { Users } from "lucide-react";

const Home = () => {
    return (
        <div className="flex-1 flex flex-col bg-background">
            <div className="min-h-calculated-screen h-full flex justify-around items-center px-6 lg:px-24 flex-col-reverse lg:flex-row gap-12 lg:gap-0">
                <div className="flex flex-col gap-4 max-w-xl text-center lg:text-left">
                    <h1 className="text-5xl font-black text-foreground">
                        Organize your tasks, stay focused
                    </h1>
                    <h2 className="text-2xl font-normal text-foreground/70">
                        With Task Manager, you can manage your day efficiently,
                        collaborate with your team, and never miss a deadline
                        again.
                    </h2>
                </div>

                <div className="flex items-center justify-center">
                    <div className="relative border border-border rounded-4xl w-96 h-fit flex flex-col p-10 bg-card shadow-xl">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Today's Tasks
                        </h1>

                        <div className="border border-border mt-4 rounded-xl px-6 py-3 flex items-center gap-4 cursor-pointer bg-background hover:bg-accent transition-colors">
                            <div className="w-2 h-2 bg-foreground rounded-full" />
                            <p className="text-foreground">
                                Design homepage mockup
                            </p>
                            <p className="text-sm text-foreground/50 absolute right-14">
                                2h
                            </p>
                        </div>

                        <div className="border border-border mt-4 rounded-xl px-6 py-3 flex items-center gap-4 cursor-pointer bg-background hover:bg-accent transition-colors">
                            <div className="w-2 h-2 bg-foreground rounded-full" />
                            <p className="text-foreground">
                                Team standup meeting
                            </p>
                            <p className="text-sm text-foreground/50 absolute right-14">
                                30m
                            </p>
                        </div>

                        <div className="border border-border mt-4 rounded-xl px-6 py-3 flex items-center gap-4 cursor-pointer bg-background">
                            <div className="w-2 h-2 bg-foreground rounded-full" />
                            <p className="text-foreground/40 line-through">
                                Review pull requests
                            </p>
                            <p className="text-sm text-foreground/50 absolute right-14">
                                Done
                            </p>
                        </div>

                        <div className="absolute left-3 -bottom-5 -rotate-6 border border-border backdrop-blur-sm mt-4 rounded-xl px-6 py-3 flex items-center gap-3 bg-card shadow-lg">
                            <Users className="text-primary" />
                            <p className="text-foreground">
                                Team Collaboration
                            </p>
                        </div>

                        <div className="absolute -right-16 bottom-20 border border-border backdrop-blur-sm mt-4 rounded-xl px-6 py-3 flex items-center gap-3 bg-card shadow-lg">
                            <Users className="text-primary" />
                            <p className="text-foreground">Fast and Easy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
