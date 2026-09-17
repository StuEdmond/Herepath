import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-bright",
  {
    variants: {
      variant: {
        primary: "bg-green-primary text-white hover:bg-green-primary/90",
        secondary:
          "border border-text-muted/40 bg-transparent text-text-primary hover:bg-surface",
        ghost: "bg-transparent text-text-primary hover:bg-surface",
        danger: "bg-red-accent-strong text-white hover:bg-red-accent-strong/90",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, fullWidth }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
