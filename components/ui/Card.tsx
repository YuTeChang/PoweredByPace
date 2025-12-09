"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

const cardVariants = {
  base: "bg-japandi-background-card rounded-card",
  variant: {
    default: "shadow-soft border border-japandi-border-light",
    elevated: "shadow-soft",
    outlined: "border border-japandi-border-light",
  },
  padding: {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  },
};

export default function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        cardVariants.base,
        cardVariants.variant[variant],
        cardVariants.padding[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

