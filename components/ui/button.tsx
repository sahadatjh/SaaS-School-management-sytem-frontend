import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          // Sizes
          size === "default" && "min-h-10 px-4 text-sm",
          size === "sm" && "min-h-8 px-3 text-xs",
          size === "lg" && "min-h-12 px-6 text-base",
          size === "icon" && "size-9 p-0",
          // Variants
          variant === "default" && "bg-orange-600 text-white hover:bg-orange-700 shadow-sm",
          variant === "ghost" && "hover:bg-slate-100 text-slate-700",
          variant === "outline" && "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm",
          variant === "secondary" && "bg-slate-100 text-slate-900 hover:bg-slate-200",
          variant === "destructive" && "bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:outline-rose-600",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
