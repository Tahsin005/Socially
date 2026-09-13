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
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black transition-all duration-300 animate-in fade-in"
    >
      <div className="relative flex flex-col items-center select-none">
        <div className="relative flex items-center justify-center size-20 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
          <div className="absolute inset-0 rounded-2xl border-2 border-zinc-800 border-t-primary animate-spin" />

          <span className="text-3xl font-bold font-mono tracking-widest text-primary animate-pulse">
            S
          </span>
        </div>

        <h2 className="mt-5 text-xl font-bold font-mono tracking-wider text-white">
          Socially
        </h2>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
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
