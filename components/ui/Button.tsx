"use client";

import { ButtonHTMLAttributes, ReactNode, ElementType } from "react";
import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
  as?: ElementType;
}

const buttonVariants = {
  base: "font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-japandi-accent-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  variant: {
    primary:
      "bg-japandi-accent-primary hover:bg-japandi-accent-hover text-white shadow-button",
    secondary:
      "bg-japandi-background-card text-japandi-text-primary border border-japandi-border-light hover:bg-japandi-background-primary",
    ghost:
      "bg-transparent text-japandi-text-primary hover:bg-japandi-background-card",
    danger:
      "bg-japandi-background-card text-japandi-text-secondary border border-japandi-border-light hover:bg-japandi-background-primary",
  },
  size: {
    sm: "px-4 py-2 text-sm rounded-full",
    md: "px-5 py-2.5 text-sm rounded-full",
    lg: "px-6 py-3 text-base rounded-full",
  },
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  asChild = false,
  as: Component = "button",
  ...props
}: ButtonProps) {
  const classes = cn(
    buttonVariants.base,
    buttonVariants.variant[variant],
    buttonVariants.size[size],
    fullWidth && "w-full",
    className
  );

  // If asChild is true, clone the child element and merge classes
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn(classes, (children as React.ReactElement).props?.className),
      ...props,
    });
  }

  return (
    <Component
      className={classes}
      {...props}
    >
      {children}
    </Component>
  );
}

