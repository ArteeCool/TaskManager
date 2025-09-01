import { useUser } from "@/features/auth/lib/useUser";
import { useUpdateUser } from "@/features/auth/lib/useUpdateUser";
import {
    Button,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
} from "@/shared/ui";
import { User, Mail, Lock, Edit, Upload } from "lucide-react";
import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import type { ProfileFormData } from "@/features/profile/model/types";

const LocalProfile = () => {
    const { user } = useUser();
    const updateUser = useUpdateUser();
    const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<ProfileFormData>({
        fullname: "",
        email: "",
        password: {
            current: "",
            new: "",
            confirm: "",
        },
        avatar: null,
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                console.error("Please select an image file");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                console.error("File size must be less than 5MB");
                return;
            }

            setFormData((prev) => ({ ...prev, avatar: file }));

            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUpload = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setPasswordStatus(null);

        if (
            formData.password.new &&
            formData.password.new !== formData.password.confirm
        ) {
            setPasswordStatus("New password and confirmation do not match");
            return;
        }

        const updatedFields = new FormData();

        if (formData.fullname && formData.fullname !== user?.fullname) {
            updatedFields.append("fullname", formData.fullname);
        }
        if (formData.email && formData.email !== user?.email) {
            updatedFields.append("email", formData.email);
        }

        if (
            formData.password.current ||
            formData.password.new ||
            formData.password.confirm
        ) {
            updatedFields.append("currentPassword", formData.password.current);
            updatedFields.append("newPassword", formData.password.new);
            updatedFields.append("confirmPassword", formData.password.confirm);
        }

        if (formData.avatar) {
            updatedFields.append("avatar", formData.avatar);
        }

        if ([...updatedFields.keys()].length === 0) {
            toast.info("Nothing to update");
            return;
        }

        try {
            await updateUser.mutateAsync(updatedFields);
            toast.success("Profile updated successfully");
            document.dispatchEvent(new Event("profileUpdated"));

            setFormData({
                fullname: "",
                email: "",
                password: { current: "", new: "", confirm: "" },
                avatar: null,
            });
            setAvatarPreview(null);
            setPasswordStatus(null);
        } catch (error: unknown) {
            toast.error("Update failed");
            if (axios.isAxiosError(error))
                setPasswordStatus(
                    error?.response?.data?.message || "Update failed"
                );
        }
    };

    return (
        <div className="flex-1 bg-base-50 dark:bg-base-950 transition-colors duration-300">
            <div className="max-w-lg mx-auto w-full p-8">
                <div className="bg-white dark:bg-base-800 rounded-2xl border border-base-300 dark:border-base-700 shadow-lg">
                    <div className="p-8 space-y-6">
                        {/* Avatar */}
                        <div className="border-b border-base-200 dark:border-base-700 pb-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-base-100 dark:bg-base-700 flex items-center justify-center overflow-hidden border-2 border-base-200 dark:border-base-600">
                                        {user?.avatarurl ? (
                                            <img
                                                src={user.avatarurl}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-base-400 dark:text-base-300" />
                                        )}
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </DialogTrigger>

                                        <DialogContent className="max-w-xl w-full dark:bg-base-800 dark:text-base-100 border-base-300 dark:border-base-700">
                                            <form
                                                onSubmit={handleSubmit}
                                                className="space-y-4"
                                            >
                                                <DialogHeader>
                                                    <DialogTitle className="text-base-900 dark:text-base-100">
                                                        Change Profile Picture
                                                    </DialogTitle>
                                                    <DialogDescription className="text-base-600 dark:text-base-400">
                                                        Upload a new profile
                                                        picture
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="w-24 h-24 rounded-full bg-base-100 dark:bg-base-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-base-300 dark:border-base-600">
                                                        {avatarPreview ? (
                                                            <img
                                                                src={
                                                                    avatarPreview
                                                                }
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : user?.avatarurl ? (
                                                            <img
                                                                src={
                                                                    user.avatarurl
                                                                }
                                                                alt="Current"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-8 h-8 text-base-400 dark:text-base-300" />
                                                        )}
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        onClick={
                                                            handleAvatarUpload
                                                        }
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        <span>
                                                            Choose Image
                                                        </span>
                                                    </Button>

                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={
                                                            handleFileChange
                                                        }
                                                        className="hidden"
                                                    />

                                                    <p className="text-xs text-base-500 dark:text-base-400 text-center">
                                                        Supported formats: JPG,
                                                        PNG, GIF
                                                        <br />
                                                        Maximum size: 5MB
                                                    </p>
                                                </div>

                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="primary"
                                                            type="button"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>
                                                    <Button
                                                        type="submit"
                                                        variant="default"
                                                        disabled={
                                                            updateUser.isPending
                                                        }
                                                    >
                                                        {updateUser.isPending
                                                            ? "Saving..."
                                                            : "Save"}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="border-b border-base-200 dark:border-base-700 pb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-base-500 dark:text-base-400 mb-1 font-medium uppercase tracking-wide">
                                            Full Name
                                        </label>
                                        <p className="text-base-900 dark:text-base-100 font-medium">
                                            {user?.fullname}
                                        </p>
                                    </div>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="w-8 h-8 rounded-lg bg-base-100 hover:bg-base-200 dark:bg-base-700 dark:hover:bg-base-600 flex items-center justify-center transition-colors">
                                            <Edit className="w-4 h-4 text-base-500 dark:text-base-300" />
                                        </button>
                                    </DialogTrigger>

                                    <DialogContent className="max-w-xl w-full dark:bg-base-800 dark:text-base-100 border-base-300 dark:border-base-700">
                                        <form
                                            onSubmit={handleSubmit}
                                            className="space-y-4"
                                        >
                                            <DialogHeader>
                                                <DialogTitle className="text-base-900 dark:text-base-100">
                                                    Change Full Name
                                                </DialogTitle>
                                                <DialogDescription className="text-base-600 dark:text-base-400">
                                                    Enter your new full name
                                                </DialogDescription>
                                            </DialogHeader>

                                            <Input
                                                name="fullname"
                                                type="text"
                                                defaultValue={
                                                    user?.fullname || ""
                                                }
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        fullname:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="bg-base-50 dark:bg-base-700 border-base-300 dark:border-base-600 text-base-900 dark:text-base-100"
                                            />

                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="primary"
                                                        type="button"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    type="submit"
                                                    variant="default"
                                                    disabled={
                                                        updateUser.isPending
                                                    }
                                                >
                                                    {updateUser.isPending
                                                        ? "Saving..."
                                                        : "Save"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="border-b border-base-200 dark:border-base-700 pb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-base-500 dark:text-base-400 mb-1 font-medium uppercase tracking-wide">
                                            Email Address
                                        </label>
                                        <p className="text-base-900 dark:text-base-100 font-medium">
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="w-8 h-8 rounded-lg bg-base-100 hover:bg-base-200 dark:bg-base-700 dark:hover:bg-base-600 flex items-center justify-center transition-colors">
                                            <Edit className="w-4 h-4 text-base-500 dark:text-base-300" />
                                        </button>
                                    </DialogTrigger>

                                    <DialogContent className="max-w-xl w-full dark:bg-base-800 dark:text-base-100 border-base-300 dark:border-base-700">
                                        <form
                                            onSubmit={handleSubmit}
                                            className="space-y-4"
                                        >
                                            <DialogHeader>
                                                <DialogTitle className="text-base-900 dark:text-base-100">
                                                    Change Email
                                                </DialogTitle>
                                                <DialogDescription className="text-base-600 dark:text-base-400">
                                                    Enter your new email address
                                                </DialogDescription>
                                            </DialogHeader>

                                            <Input
                                                name="email"
                                                type="email"
                                                defaultValue={user?.email || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                className="bg-base-50 dark:bg-base-700 border-base-300 dark:border-base-600 text-base-900 dark:text-base-100"
                                            />

                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="primary"
                                                        type="button"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    type="submit"
                                                    variant="default"
                                                    disabled={
                                                        updateUser.isPending
                                                    }
                                                >
                                                    {updateUser.isPending
                                                        ? "Saving..."
                                                        : "Save"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-base-500 dark:text-base-400 mb-1 font-medium uppercase tracking-wide">
                                            Password
                                        </label>
                                        <p className="text-base-900 dark:text-base-100 font-medium">
                                            ••••••••••••
                                        </p>
                                    </div>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="w-8 h-8 rounded-lg bg-base-100 hover:bg-base-200 dark:bg-base-700 dark:hover:bg-base-600 flex items-center justify-center transition-colors">
                                            <Edit className="w-4 h-4 text-base-500 dark:text-base-300" />
                                        </button>
                                    </DialogTrigger>

                                    <DialogContent className="max-w-xl w-full dark:bg-base-800 dark:text-base-100 border-base-300 dark:border-base-700">
                                        <form
                                            onSubmit={handleSubmit}
                                            className="space-y-4"
                                        >
                                            <DialogHeader>
                                                <DialogTitle className="text-base-900 dark:text-base-100">
                                                    Change Password
                                                </DialogTitle>
                                                <DialogDescription className="text-base-600 dark:text-base-400">
                                                    Enter your current password
                                                    and your new password
                                                </DialogDescription>
                                            </DialogHeader>

                                            {passwordStatus && (
                                                <div className="mb-4 p-4 rounded-lg border transition-all duration-300 ease-in-out bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-600 text-red-800 dark:text-red-300 border-l-4 border-l-red-500">
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
                                                                {passwordStatus}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200"
                                                            onClick={() =>
                                                                setPasswordStatus(
                                                                    null
                                                                )
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

                                            <Input
                                                name="currentPassword"
                                                type="password"
                                                placeholder="Current password"
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        password: {
                                                            ...prev.password,
                                                            current:
                                                                e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="bg-base-50 dark:bg-base-700 border-base-300 dark:border-base-600 text-base-900 dark:text-base-100"
                                            />

                                            <Input
                                                name="newPassword"
                                                type="password"
                                                placeholder="New password"
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        password: {
                                                            ...prev.password,
                                                            new: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="bg-base-50 dark:bg-base-700 border-base-300 dark:border-base-600 text-base-900 dark:text-base-100"
                                            />

                                            <Input
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="Confirm new password"
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        password: {
                                                            ...prev.password,
                                                            confirm:
                                                                e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="bg-base-50 dark:bg-base-700 border-base-300 dark:border-base-600 text-base-900 dark:text-base-100"
                                            />

                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="primary"
                                                        type="button"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    type="submit"
                                                    variant="default"
                                                    disabled={
                                                        updateUser.isPending
                                                    }
                                                >
                                                    {updateUser.isPending
                                                        ? "Saving..."
                                                        : "Save"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocalProfile;
