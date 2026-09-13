'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Loader2Icon, SearchIcon, UserPlusIcon } from "lucide-react";
import { ConversationParticipant, getOrCreateConversation, searchUsersToMessage } from "@/actions/message.action";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation: (conversationId: string) => void;
}

export default function NewChatDialog({
  open,
  onOpenChange,
  onSelectConversation,
}: NewChatDialogProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<ConversationParticipant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setUsers([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setUsers([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchUsersToMessage(trimmed);
        setUsers(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartChat = async (user: ConversationParticipant) => {
    try {
      setIsStartingChat(user.id);
      const res = await getOrCreateConversation(user.id);
      if (res?.success && res.conversation) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
        onSelectConversation(res.conversation.id);
        onOpenChange(false);
      } else {
        toast.error(res?.error || "Failed to start conversation");
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Failed to start conversation");
    } finally {
      setIsStartingChat(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="size-5 text-primary" />
            New Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="mt-2 min-h-[220px] max-h-[320px] overflow-y-auto space-y-1 divide-y divide-border/30">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
              <Loader2Icon className="size-6 animate-spin mb-2 text-primary" />
              Searching users...
            </div>
          ) : users.length > 0 ? (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-10">
                    <AvatarImage src={u.image || "/avatar.png"} />
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name || u.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleStartChat(u)}
                  disabled={isStartingChat === u.id}
                  className="shrink-0"
                >
                  {isStartingChat === u.id ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    "Chat"
                  )}
                </Button>
              </div>
            ))
          ) : searchQuery.trim() ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No users found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Type a name or username to find someone to chat with.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
