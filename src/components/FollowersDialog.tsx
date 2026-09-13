"use client";

import { useEffect, useState } from "react";
import { getUserFollowers, getUserFollowing } from "@/actions/user.action";
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
import { Loader2Icon, UsersIcon } from "lucide-react";

type UserItem = {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
  _count: {
    followers: number;
    following: number;
  };
};

interface FollowersDialogProps {
  userId: string;
  initialTab?: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | null;
}

export default function FollowersDialog({
  userId,
  initialTab = "followers",
  open,
  onOpenChange,
  currentUserId,
}: FollowersDialogProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [followers, setFollowers] = useState<UserItem[] | null>(null);
  const [following, setFollowing] = useState<UserItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [followersData, followingData] = await Promise.all([
          getUserFollowers(userId),
          getUserFollowing(userId),
        ]);
        setFollowers(followersData);
        setFollowing(followingData);
      } catch (error) {
        console.error("Error loading follow lists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, userId]);

  const renderUserList = (users: UserItem[] | null, emptyText: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin mr-2" />
          <span>Loading...</span>
        </div>
      );
    }

    if (!users || users.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <div className="size-10 mx-auto rounded-full bg-muted/60 flex items-center justify-center">
            <UsersIcon className="size-5" />
          </div>
          <p className="text-sm">{emptyText}</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-4">
          {users.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <Link
                href={`/profile/${item.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={item.image || "/avatar.png"} />
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate hover:underline">
                    {item.name ?? item.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{item.username}
                  </p>
                  {item.bio && (
                    <p className="text-xs text-foreground/80 line-clamp-1 mt-0.5">
                      {item.bio}
                    </p>
                  )}
                </div>
              </Link>

              {currentUserId && currentUserId !== item.id && (
                <FollowButton
                  userId={item.id}
                  initialIsFollowing={item.isFollowing}
                  onFollowToggle={(nextIsFollowing) => {
                    setFollowers((prev) =>
                      prev
                        ? prev.map((u) =>
                            u.id === item.id ? { ...u, isFollowing: nextIsFollowing } : u
                          )
                        : prev
                    );
                    setFollowing((prev) =>
                      prev
                        ? prev.map((u) =>
                            u.id === item.id ? { ...u, isFollowing: nextIsFollowing } : u
                          )
                        : prev
                    );
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center">Connections</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "followers" | "following")}
          className="w-full mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers {followers ? `(${followers.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="following">
              Following {following ? `(${following.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4">
            {renderUserList(followers, "No followers yet.")}
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            {renderUserList(following, "Not following anyone yet.")}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
