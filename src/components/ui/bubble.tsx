import * as React from "react";
import { cn } from "@/lib/utils";
import { useMessageContext } from "./message";

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "muted" | "outline";
}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ variant, className, children, ...props }, ref) => {
    const { align } = useMessageContext();

    const resolvedVariant =
      variant || (align === "end" ? "primary" : "muted");

    return (
      <div
        ref={ref}
        className={cn(
          "relative px-4 py-2.5 text-sm break-words leading-relaxed shadow-2xs transition-colors",
          resolvedVariant === "primary" &&
            "bg-primary text-primary-foreground rounded-2xl rounded-br-xs",
          resolvedVariant === "muted" &&
            "bg-muted/85 text-foreground border border-border/40 rounded-2xl rounded-bl-xs",
          resolvedVariant === "outline" &&
            "border border-border bg-background text-foreground rounded-2xl",
          resolvedVariant === "default" &&
            "bg-card text-card-foreground border border-border/60 rounded-2xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Bubble.displayName = "Bubble";

export interface BubbleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const BubbleContent = React.forwardRef<HTMLDivElement, BubbleContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("whitespace-pre-wrap break-words", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BubbleContent.displayName = "BubbleContent";

export { Bubble, BubbleContent };
