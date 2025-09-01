import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center cursor-pointer justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
    {
        variants: {
            variant: {
                default:
                    "bg-background text-foreground border border-border hover:brightness-120 active:brightness-105",
                primary:
                    "bg-foreground text-background border border-foreground hover:brightness-120 active:brightness-105",
                destructive:
                    "bg-destructive text-background border border-destructive hover:brightness-120 active:brightness-105",
                ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
                outline:
                    "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                small: "h-8 px-3 text-sm",
                medium: "h-10 px-4 text-base",
                large: "h-12 px-6 text-lg",
                icon: "h-9 w-9",
            },
            fullWidth: {
                true: "w-full",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "medium",
            fullWidth: false,
        },
    }
);
