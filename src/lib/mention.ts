/**
 * Utility functions for extracting and parsing @username mentions in text.
 */

export interface MentionToken {
  type: "text" | "mention";
  value: string;
  username?: string;
}

// Regex matches @username when preceded by start of line or non-word characters.
// This ensures email addresses like 'user@example.com' are NOT treated as mentions.
const MENTION_REGEX = /(?:^|[^\w])@([a-zA-Z0-9_]+)/g;

/**
 * Extracts unique usernames mentioned in a text string.
 * Returns an array of unique usernames.
 */
export function extractMentions(text: string | null | undefined): string[] {
  if (!text || typeof text !== "string") return [];

  const usernames = new Set<string>();
  const regex = new RegExp(MENTION_REGEX);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      usernames.add(match[1]);
    }
  }

  return Array.from(usernames);
}

/**
 * Tokenizes text into plain text chunks and @username mentions for rendering.
 */
export function parseMentionTokens(text: string | null | undefined): MentionToken[] {
  if (!text) return [];

  const tokens: MentionToken[] = [];
  const regex = /(?:^|(?<=[^\w]))@([a-zA-Z0-9_]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    // The @ starts at matchIndex
    if (matchIndex > lastIndex) {
      tokens.push({
        type: "text",
        value: text.substring(lastIndex, matchIndex),
      });
    }

    const username = match[1];
    tokens.push({
      type: "mention",
      value: `@${username}`,
      username,
    });

    lastIndex = matchIndex + username.length + 1; // 1 for the '@'
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      value: text.substring(lastIndex),
    });
  }

  return tokens;
}
