"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  container?: boolean;
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

export default function Page({
  children,
  container = true,
  maxWidth = "2xl",
  className,
  ...props
}: PageProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-japandi-background-primary",
        className
      )}
      {...props}
    >
      {container ? (
        <div className={cn("mx-auto px-4 py-8", maxWidthClasses[maxWidth])}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

