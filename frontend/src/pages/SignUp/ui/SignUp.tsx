import type { SignUpFormData } from "../model";
import { Button, Input } from "@/shared/ui";
import { useState } from "react";
import { signUp } from "../model/service";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router";
import { login } from "@/pages/LogIn/model";

const SignUp = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<SignUpFormData>({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<SignUpFormData>({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [statusText, setStatusText] = useState("");

    const signUpMutation = useMutation({
        mutationKey: ["signUp"],
        mutationFn: signUp,
    });

    const logInMutation = useMutation({
        mutationKey: ["logIn"],
        mutationFn: login,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const key = name as keyof SignUpFormData;

        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));

        if (errors[key]) {
            setErrors((prev) => ({
                ...prev,
                [key]: "",
            }));
        }
    };

    const validateForm = () => {
        const newErrors: SignUpFormData = {
            fullname: "",
            email: "",
            password: "",
            confirmPassword: "",
        };

        if (!formData.fullname.trim()) {
            newErrors.fullname = "Full name is required";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 5) {
            newErrors.password = "Password must be at least 5 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateForm();
        const hasErrors = Object.values(validationErrors).some(
            (err) => err !== ""
        );

        if (hasErrors) {
            setErrors(validationErrors);
            return;
        }

        setErrors({
            fullname: "",
            email: "",
            password: "",
            confirmPassword: "",
        });
        setStatusText("");

        try {
            await signUpMutation.mutateAsync({
                fullname: formData.fullname,
                email: formData.email,
                password: formData.password,
            });
            await logInMutation.mutateAsync({
                email: formData.email,
                password: formData.password,
            });
            navigate("/app/dashboard");
            document.dispatchEvent(new Event("authorizated"));
        } catch (error: unknown) {
            let message = "Sign up failed";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || message;
            }
            setStatusText(message);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-background">
            <div className="w-full max-w-md">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Create Account
                    </h1>
                    <p className="text-foreground/70">
                        Join us and start your journey today
                    </p>
                </div>

                <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        {statusText && (
                            <div className="mb-4 p-4 rounded-lg border transition-all duration-300 ease-in-out bg-red-50 border-red-200 text-red-800 border-l-4 border-l-red-500">
                                <div className="flex items-start space-x-3">
                                    <svg
                                        className="w-5 h-5 text-red-500 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium leading-5">
                                            {statusText}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                        onClick={() => setStatusText("")}
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
                        <Input
                            label="Full Name"
                            name="fullname"
                            type="name"
                            size={0}
                            placeholder="Enter your full name"
                            value={formData.fullname}
                            onChange={handleInputChange}
                            error={errors.fullname}
                        />

                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={errors.email}
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleInputChange}
                            error={errors.password}
                        />

                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            error={errors.confirmPassword}
                        />

                        <Button
                            type="submit"
                            disabled={signUpMutation.isPending}
                            className="w-full"
                        >
                            {signUpMutation.isPending ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                    Creating Account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </Button>

                        <p className="text-center text-foreground/70 text-sm">
                            Already have an account?{" "}
                            <a
                                href="/login"
                                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                            >
                                Log In
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
