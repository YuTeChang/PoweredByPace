"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

export default function Container({
  children,
  maxWidth = "2xl",
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto px-4", maxWidthClasses[maxWidth], className)}
      {...props}
    >
      {children}
    </div>
  );
}

