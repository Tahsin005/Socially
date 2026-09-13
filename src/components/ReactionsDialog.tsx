"use client";

import { useEffect, useState, useMemo } from "react";
import { getPostReactions } from "@/actions/post.action";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
import { Loader2Icon, SmileIcon } from "lucide-react";
import { ReactionType } from "@/lib/validations";
import { REACTION_CONFIGS } from "./ReactionPicker";

type ReactedUser = {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  reactionType: ReactionType;
  isFollowing: boolean;
  _count: {
    followers: number;
    following: number;
  };
};

interface ReactionsDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | null;
}

export default function ReactionsDialog({
  postId,
  open,
  onOpenChange,
  currentUserId,
}: ReactionsDialogProps) {
  const [reactions, setReactions] = useState<ReactedUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getPostReactions(postId);
        setReactions(data as ReactedUser[]);
      } catch (error) {
        console.error("Error loading reactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, postId]);

  const reactionCounts = useMemo(() => {
    if (!reactions) return { all: 0, LIKE: 0, FIRE: 0, CLAP: 0, IDEA: 0, LAUGH: 0 };
    const counts: Record<string, number> = { all: reactions.length, LIKE: 0, FIRE: 0, CLAP: 0, IDEA: 0, LAUGH: 0 };
    for (const r of reactions) {
      if (counts[r.reactionType] !== undefined) {
        counts[r.reactionType]++;
      }
    }
    return counts;
  }, [reactions]);

  const filteredUsers = useMemo(() => {
    if (!reactions) return [];
    if (activeTab === "all") return reactions;
    return reactions.filter((r) => r.reactionType === activeTab);
  }, [reactions, activeTab]);

  const availableReactionTabs = useMemo(() => {
    const types: ReactionType[] = ["LIKE", "FIRE", "CLAP", "IDEA", "LAUGH"];
    return types.filter((t) => (reactionCounts[t] ?? 0) > 0);
  }, [reactionCounts]);

  const renderUserList = (users: ReactedUser[]) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin mr-2" />
          <span>Loading reactions...</span>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <div className="size-10 mx-auto rounded-full bg-muted/60 flex items-center justify-center">
            <SmileIcon className="size-5" />
          </div>
          <p className="text-sm">No reactions in this category</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border/60">
        {users.map((u) => {
          const config = REACTION_CONFIGS[u.reactionType];

          return (
            <div
              key={u.id}
              className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                <Link
                  href={`/profile/${u.username}`}
                  onClick={() => onOpenChange(false)}
                  className="relative flex-shrink-0"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={u.image ?? "/avatar.png"} alt={u.name ?? u.username} />
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 text-sm bg-background rounded-full shadow-sm border border-border/60 leading-none p-0.5 select-none">
                    {config?.emoji ?? "❤️"}
                  </span>
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/profile/${u.username}`}
                      onClick={() => onOpenChange(false)}
                      className="font-semibold text-sm hover:underline truncate"
                    >
                      {u.name || u.username}
                    </Link>
                    <span className="text-xs text-muted-foreground truncate">
                      @{u.username}
                    </span>
                  </div>

                  {u.bio && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {u.bio}
                    </p>
                  )}
                </div>
              </div>

              {currentUserId && currentUserId !== u.id && (
                <div className="flex-shrink-0">
                  <FollowButton userId={u.id} initialIsFollowing={u.isFollowing} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <span>Reactions</span>
            {reactions && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-normal text-muted-foreground">
                {reactions.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-3 border-b bg-muted/20">
            <TabsList className="h-9 p-1 bg-muted/60 gap-1 overflow-x-auto w-full justify-start">
              <TabsTrigger value="all" className="text-xs px-2.5 py-1">
                All {reactionCounts.all > 0 && `(${reactionCounts.all})`}
              </TabsTrigger>
              {availableReactionTabs.map((type) => {
                const config = REACTION_CONFIGS[type];
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="text-xs px-2 py-1 flex items-center gap-1"
                  >
                    <span>{config.emoji}</span>
                    <span>{reactionCounts[type]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <ScrollArea className="h-[360px]">
            <TabsContent value={activeTab} className="m-0 focus-visible:outline-none">
              {renderUserList(filteredUsers)}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
