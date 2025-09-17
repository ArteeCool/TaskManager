import { useCreateBoard } from "@/features/boards/lib/useCreateBoard";
import type { BoardRequest } from "@/features/boards/model/types";
import { Button, Input } from "@/shared/ui";
import axios from "axios";
import { useState } from "react";
import { Compact } from "@uiw/react-color";
import { useNavigate } from "react-router";

const colors = [
    "#4DA3FF", // sky blue
    "#4DD4AC", // aqua green
    "#FFB366", // peach orange
    "#7DC95E", // fresh green
    "#A58DFF", // lavender purple
    "#FF85A1", // soft pink
    "#FFD369", // warm yellow
    "#5FD1B0", // teal mint
    "#FF9AA2", // blush rose
    "#C084FC", // violet
];

const darkenHex = (hex: string, percent: number) => {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;

    r = Math.round(Math.max(0, Math.min(255, r - (r * percent) / 100)));
    g = Math.round(Math.max(0, Math.min(255, g - (g * percent) / 100)));
    b = Math.round(Math.max(0, Math.min(255, b - (b * percent) / 100)));

    const toHex = (c: number) => c.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const CreateBoard = () => {
    const [formData, setFormData] = useState<BoardRequest>({
        title: "",
        description: "",
        colorBackground: darkenHex("#4DA3FF", 75),
        colorAccent: "#4DA3FF",
    });
    const [errors, setErrors] = useState<BoardRequest>({
        title: "",
        description: "",
        colorBackground: "",
        colorAccent: "",
    });
    const [statusText, setStatusText] = useState("");
    const boardMutation = useCreateBoard();
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const key = name as keyof BoardRequest;

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setErrors({
            title: "",
            description: "",
            colorBackground: "",
            colorAccent: "",
        });
        setStatusText("");

        const newErrors: Partial<BoardRequest> = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        } else if (formData.title.length < 3) {
            newErrors.title = "Title must be at least 3 characters";
        }

        if (formData.description && formData.description.length > 200) {
            newErrors.description = "Description is too long (max 200 chars)";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...newErrors }));
            setStatusText("Please fix the highlighted fields.");
            return;
        }

        try {
            await boardMutation.mutateAsync(formData);
            setStatusText("");
            setFormData({
                title: "",
                description: "",
                colorBackground: "",
                colorAccent: "",
            });

            navigate("/app/boards");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setStatusText(
                    error.response?.data?.message || "Error creating board"
                );
            }
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-background">
            <div className="w-full max-w-lg">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Create Board
                    </h1>
                    <p className="text-foreground/70">
                        Create new board for your project
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
                            label="Title"
                            name="title"
                            type="text"
                            size={0}
                            placeholder="Enter title"
                            value={formData.title}
                            onChange={handleInputChange}
                            error={errors.title}
                        />

                        <Input
                            label="Description"
                            name="description"
                            type="text"
                            placeholder="Enter description"
                            value={formData.description}
                            onChange={handleInputChange}
                            error={errors.description}
                        />
                        <div>
                            <h1 className="block text-sm font-medium mb-2 text-foreground">
                                Board Color
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 p-3 rounded-lg border border-border bg-background">
                                    <Compact
                                        color={formData.colorAccent}
                                        colors={colors}
                                        onChange={(color) => {
                                            const accent = color.hex;
                                            const background = darkenHex(
                                                color.hex,
                                                75
                                            );

                                            setFormData((prev) => ({
                                                ...prev,
                                                colorAccent: accent,
                                                colorBackground: background,
                                            }));
                                        }}
                                        style={{
                                            width: "100%",
                                            background: "transparent",
                                        }}
                                    />
                                </div>
                                <div
                                    className="w-12 h-12 rounded-lg border shadow-sm"
                                    style={{
                                        backgroundColor: formData.colorAccent,
                                    }}
                                />
                                <div
                                    className="w-12 h-12 rounded-lg border shadow-sm"
                                    style={{
                                        backgroundColor:
                                            formData.colorBackground,
                                    }}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={boardMutation.isPending}
                            className="w-full"
                        >
                            {boardMutation.isPending ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                    Creating board...
                                </div>
                            ) : (
                                "Create board"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateBoard;
