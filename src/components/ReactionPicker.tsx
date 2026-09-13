"use client";

import { ReactionType } from "@/lib/validations";
import { useState } from "react";

export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
  activeClass: string;
}

export const REACTION_CONFIGS: Record<ReactionType, ReactionConfig> = {
  LIKE: {
    type: "LIKE",
    emoji: "❤️",
    label: "Love",
    color: "text-rose-500",
    activeClass: "text-rose-500 hover:text-rose-600 dark:text-rose-400",
  },
  FIRE: {
    type: "FIRE",
    emoji: "🔥",
    label: "Fire",
    color: "text-amber-500",
    activeClass: "text-amber-500 hover:text-amber-600 dark:text-amber-400",
  },
  CLAP: {
    type: "CLAP",
    emoji: "👏",
    label: "Clap",
    color: "text-emerald-500",
    activeClass: "text-emerald-500 hover:text-emerald-600 dark:text-emerald-400",
  },
  IDEA: {
    type: "IDEA",
    emoji: "💡",
    label: "Idea",
    color: "text-yellow-500",
    activeClass: "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400",
  },
  LAUGH: {
    type: "LAUGH",
    emoji: "😂",
    label: "Haha",
    color: "text-sky-500",
    activeClass: "text-sky-500 hover:text-sky-600 dark:text-sky-400",
  },
};

export const REACTION_LIST = [
  REACTION_CONFIGS.LIKE,
  REACTION_CONFIGS.FIRE,
  REACTION_CONFIGS.CLAP,
  REACTION_CONFIGS.IDEA,
  REACTION_CONFIGS.LAUGH,
];

interface ReactionPickerProps {
  currentReaction: ReactionType | null;
  onSelectReaction: (type: ReactionType) => void;
  onClose?: () => void;
  positionClassName?: string;
}

export default function ReactionPicker({
  currentReaction,
  onSelectReaction,
  onClose,
  positionClassName = "bottom-full mb-2 left-0",
}: ReactionPickerProps) {
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

  return (
    <div
      role="toolbar"
      aria-label="Choose a reaction"
      className={`absolute ${positionClassName} z-40 flex items-center gap-1 px-2 py-1.5 bg-background/95 backdrop-blur-md border border-border/70 rounded-full shadow-lg shadow-black/10 dark:shadow-black/40 animate-in fade-in zoom-in-90 duration-150`}
      onClick={(e) => e.stopPropagation()}
    >
      {REACTION_LIST.map((reaction) => {
        const isSelected = currentReaction === reaction.type;
        const isHovered = hoveredReaction === reaction.type;

        return (
          <div key={reaction.type} className="relative flex flex-col items-center">
            {isHovered && (
              <span className="absolute -top-7 px-2 py-0.5 text-[11px] font-semibold text-white bg-neutral-900/90 dark:bg-neutral-100/90 dark:text-neutral-900 rounded-full shadow-sm whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-100">
                {reaction.label}
              </span>
            )}
            <button
              type="button"
              aria-label={reaction.label}
              onMouseEnter={() => setHoveredReaction(reaction.type)}
              onMouseLeave={() => setHoveredReaction(null)}
              onClick={() => {
                onSelectReaction(reaction.type);
                if (onClose) onClose();
              }}
              className={`text-xl sm:text-2xl p-1.5 rounded-full transition-all duration-150 transform hover:scale-135 active:scale-95 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "bg-primary/10 ring-1 ring-primary/40 scale-110"
                  : "hover:bg-muted/70"
              }`}
            >
              <span className="inline-block transition-transform duration-100">
                {reaction.emoji}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
