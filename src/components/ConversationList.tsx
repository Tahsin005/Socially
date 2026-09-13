'use client';

import { useMemo, useState } from "react";
import { FormattedConversation } from "@/actions/message.action";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PlusIcon, SearchIcon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

interface ConversationListProps {
  conversations: FormattedConversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  currentUserId: string | null;
  isLoading?: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  currentUserId,
  isLoading = false,
}: ConversationListProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter(
      (c) =>
        c.otherUser.username.toLowerCase().includes(query) ||
        (c.otherUser.name && c.otherUser.name.toLowerCase().includes(query))
    );
  }, [conversations, filterQuery]);

  return (
    <div className="flex flex-col h-full bg-card/40">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Messages</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onNewChat}
          className="gap-1.5 h-8 px-3 rounded-lg"
        >
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
      </div>

      <div className="p-3 border-b border-border/30">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-9 h-9 text-sm bg-background/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/20">
        {isLoading && conversations.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedConversationId;
            const isLastMessageMine =
              conv.lastMessage?.senderId === currentUserId;

            let timeAgo = "";
            if (conv.lastMessage) {
              try {
                timeAgo = formatDistanceToNowStrict(new Date(conv.lastMessage.createdAt), {
                  addSuffix: false,
                });
              } catch {
                timeAgo = "";
              }
            }

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-l-4 border-primary"
                    : "hover:bg-muted/40"
                }`}
              >
                <Avatar className="size-11 shrink-0 border">
                  <AvatarImage src={conv.otherUser.image || "/avatar.png"} />
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm truncate text-foreground">
                      {conv.otherUser.name || conv.otherUser.username}
                    </span>
                    {timeAgo && (
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-1">
                        {timeAgo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        conv.unreadCount > 0
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {conv.lastMessage ? (
                        <>
                          {isLastMessageMine && (
                            <span className="font-normal opacity-80">You: </span>
                          )}
                          {conv.lastMessage.content}
                        </>
                      ) : (
                        <span className="italic opacity-70">Conversation started</span>
                      )}
                    </p>

                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shrink-0 shadow-xs">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground text-sm">
            {filterQuery.trim() ? (
              <p className="font-medium text-foreground">No conversations match your search</p>
            ) : (
              <>
                <p className="font-medium text-foreground">No conversations yet</p>
                <p className="text-xs mt-1 mb-4">Start chatting with users across the platform.</p>
                <Button size="sm" onClick={onNewChat} className="rounded-lg">
                  <PlusIcon className="size-4 mr-1.5" />
                  Start a Conversation
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
