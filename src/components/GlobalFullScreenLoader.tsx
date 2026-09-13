'use client';

import React from 'react';

interface GlobalFullScreenLoaderProps {
  message?: string;
}

export default function GlobalFullScreenLoader({
  message = "Loading...",
}: GlobalFullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      <div className="relative flex flex-col items-center select-none">
        <div className="absolute -inset-4 rounded-full bg-primary/15 blur-2xl animate-pulse" />

        <div className="relative flex items-center justify-center size-20 rounded-3xl bg-card border border-primary/25 shadow-2xl">
          <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 border-t-primary animate-spin" />

          <span className="text-3xl font-bold font-mono tracking-widest text-primary animate-pulse">
            S
          </span>
        </div>

        <h2 className="mt-5 text-xl font-bold font-mono tracking-wider text-foreground">
          Socially
        </h2>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>{message}</span>
          <span className="flex gap-1 items-center">
            <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="size-1 rounded-full bg-primary animate-bounce" />
          </span>
        </div>
      </div>
    </div>
  );
}
