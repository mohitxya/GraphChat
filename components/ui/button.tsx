import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" &&
          "bg-accent text-slate-950 hover:bg-sky-300 focus:outline-none focus:ring-2 focus:ring-accent/50",
        variant === "secondary" &&
          "border border-border bg-panel2 text-foreground hover:border-slate-500",
        variant === "ghost" && "text-muted hover:bg-white/5 hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}
