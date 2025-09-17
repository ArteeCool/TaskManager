import { useRequestResetPassword } from "@/features/auth/lib/useRequestResetPassword";
import { Button, Input } from "@/shared/ui";
import axios from "axios";
import { useState } from "react";

const ForgotPassword = () => {
    const [email, setEmail] = useState<string>("");
    const [status, setStatus] = useState<{
        text: string;
        type: "success" | "error" | "";
    }>({
        text: "",
        type: "",
    });
    const { mutateAsync } = useRequestResetPassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setStatus({
                text: "Please enter your email address.",
                type: "error",
            });
            return;
        }

        try {
            await mutateAsync(email);
            setStatus({
                text: "We've sent you a reset link. Please check your inbox.",
                type: "success",
            });
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setStatus({
                    text:
                        error?.response?.data?.message ||
                        "Failed to send reset link. Please try again.",
                    type: "error",
                });
            } else {
                setStatus({
                    text: "Something went wrong. Please try again later.",
                    type: "error",
                });
            }
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-background">
            <div className="w-full max-w-md">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Forgot Password
                    </h1>
                    <p className="text-foreground/70">
                        Enter your email address below and we'll send you a link
                    </p>
                </div>

                {/* Status message */}
                {status.text && (
                    <div
                        className={`mb-4 p-4 rounded-lg border transition-all duration-300 ease-in-out border-l-4 ${
                            status.type === "success"
                                ? "bg-green-50 border-green-200 text-green-800 border-l-green-500"
                                : "bg-red-50 border-red-200 text-red-800 border-l-red-500"
                        }`}
                    >
                        <div className="flex items-start space-x-3">
                            <svg
                                className={`w-5 h-5 flex-shrink-0 ${
                                    status.type === "success"
                                        ? "text-green-500"
                                        : "text-red-500"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d={
                                        status.type === "success"
                                            ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    }
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-medium leading-5">
                                    {status.text}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                onClick={() =>
                                    setStatus({ text: "", type: "" })
                                }
                                aria-label="Dismiss message"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        <Input
                            type="email"
                            name="email"
                            label="Email"
                            placeholder="Enter your email address"
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Button type="submit" fullWidth>
                            Send Reset Link
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
