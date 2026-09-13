'use client';

import React from "react";
import Link from "next/link";
import { parseMentionTokens } from "@/lib/mention";

interface MentionTextProps {
  content: string | null | undefined;
  className?: string;
  asLink?: boolean;
  mentionClassName?: string;
}

export default function MentionText({
  content,
  className = "",
  asLink = true,
  mentionClassName = "",
}: MentionTextProps) {
  if (!content) return null;

  const tokens = parseMentionTokens(content);

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {tokens.map((token, index) => {
        if (token.type === "mention" && token.username) {
          if (!asLink) {
            return (
              <span
                key={index}
                className={`font-semibold text-primary ${mentionClassName}`}
              >
                {token.value}
              </span>
            );
          }

          return (
            <Link
              key={index}
              href={`/profile/${token.username}`}
              onClick={(e) => e.stopPropagation()}
              className={`font-semibold text-primary hover:underline hover:text-primary/80 transition-colors ${mentionClassName}`}
            >
              {token.value}
            </Link>
          );
        }

        return <React.Fragment key={index}>{token.value}</React.Fragment>;
      })}
    </span>
  );
}
