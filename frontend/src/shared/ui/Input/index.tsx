import { Mail, User, Lock, EyeOff, Eye } from "lucide-react";
import { useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    className?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    hideIcon?: boolean;
    hidePasswordToggle?: boolean;
}

const Input = ({
    label,
    error,
    className = "",
    type = "text",
    leftIcon,
    rightIcon,
    hideIcon = false,
    hidePasswordToggle = false,
    ...props
}: InputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const defaultIcon =
        type === "email" ? (
            <Mail size={18} />
        ) : type === "password" ? (
            <Lock size={18} />
        ) : type === "name" ? (
            <User size={18} />
        ) : null;

    return (
        <div className="flex flex-col w-full">
            {label && (
                <label className="mb-2 text-base-700 text-sm font-medium">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={inputType}
                    className={`w-full px-3 py-2 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-base-400 
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                            error
                                ? "border-destructive focus:border-destructive focus:ring-destructive"
                                : isFocused
                                ? "border-primary-300"
                                : "border-base-200 hover:border-base-300"
                        }
                        ${leftIcon || (!hideIcon && defaultIcon) ? "pl-11" : ""}
                        ${
                            rightIcon || (isPassword && !hidePasswordToggle)
                                ? "pr-11"
                                : ""
                        }
                        ${className}`}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {!hideIcon && (leftIcon || defaultIcon) && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-400">
                        {leftIcon || defaultIcon}
                    </div>
                )}

                {isPassword && !hidePasswordToggle ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-400 hover:text-base-600 transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff size={18} />
                        ) : (
                            <Eye size={18} />
                        )}
                    </button>
                ) : (
                    rightIcon && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-400">
                            {rightIcon}
                        </div>
                    )
                )}
            </div>
            {error && (
                <span className="mt-1 text-destructive text-sm font-medium">
                    {error}
                </span>
            )}
        </div>
    );
};

export default Input;
