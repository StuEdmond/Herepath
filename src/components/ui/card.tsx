import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl bg-surface", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardImageProps {
  src?: string;
  alt: string;
  badge?: ReactNode;
  className?: string;
}

export function CardImage({ src, alt, badge, className }: CardImageProps) {
  return (
    <div className={cn("relative aspect-[4/3] w-full bg-surface-raised", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[13px] text-text-muted">
          No image yet
        </span>
      )}
      {badge && <div className="absolute left-2 top-2">{badge}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 p-4", className)} {...props}>
      {children}
    </div>
  );
}
