"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "muted";
  size?: "sm" | "base" | "lg";
  as?: "p" | "span" | "div";
}

const textVariants = {
  variant: {
    primary: "text-japandi-text-primary",
    secondary: "text-japandi-text-secondary",
    muted: "text-japandi-text-muted",
  },
  size: {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  },
};

export default function Text({
  children,
  variant = "primary",
  size = "base",
  as: Component = "p",
  className,
  ...props
}: TextProps) {
  return (
    <Component
      className={cn(
        textVariants.variant[variant],
        textVariants.size[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

