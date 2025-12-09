"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const headingClasses = {
  1: "text-3xl font-bold text-japandi-text-primary",
  2: "text-2xl font-bold text-japandi-text-primary",
  3: "text-xl font-semibold text-japandi-text-primary",
  4: "text-lg font-semibold text-japandi-text-primary",
  5: "text-base font-semibold text-japandi-text-primary",
  6: "text-sm font-semibold text-japandi-text-primary",
};

export default function Heading({
  children,
  level = 1,
  as,
  className,
  ...props
}: HeadingProps) {
  const Tag = (as || `h${level}`) as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  
  const Component = Tag;
  
  return (
    <Component
      className={cn(headingClasses[level], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

