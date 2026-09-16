import { type AnchorHTMLAttributes, forwardRef } from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export interface LinkButtonProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant, fullWidth, ...props }, ref) => {
    return <a ref={ref} className={cn(buttonVariants({ variant, fullWidth }), className)} {...props} />;
  },
);
LinkButton.displayName = "LinkButton";
