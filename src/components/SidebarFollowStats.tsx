"use client";

import { useState } from "react";
import { Separator } from "./ui/separator";
import FollowersDialog from "./FollowersDialog";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getUserStats } from "@/actions/user.action";

interface SidebarFollowStatsProps {
  userId: string;
  followingCount: number;
  followersCount: number;
}

export default function SidebarFollowStats({
  userId,
  followingCount: initialFollowingCount,
  followersCount: initialFollowersCount,
}: SidebarFollowStatsProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");

  const { data: stats } = useQuery({
    queryKey: queryKeys.users.stats(userId),
    queryFn: () => getUserStats(userId),
    initialData: {
      followingCount: initialFollowingCount,
      followersCount: initialFollowersCount,
    },
  });

  const followingCount = stats?.followingCount ?? initialFollowingCount;
  const followersCount = stats?.followersCount ?? initialFollowersCount;

  return (
    <>
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => {
            setTab("following");
            setOpen(true);
          }}
          className="flex-1 text-center group transition-colors hover:opacity-80 cursor-pointer"
        >
          <p className="font-medium group-hover:text-primary transition-colors">
            {followingCount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Following</p>
        </button>
        <Separator orientation="vertical" className="h-8" />
        <button
          type="button"
          onClick={() => {
            setTab("followers");
            setOpen(true);
          }}
          className="flex-1 text-center group transition-colors hover:opacity-80 cursor-pointer"
        >
          <p className="font-medium group-hover:text-primary transition-colors">
            {followersCount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Followers</p>
        </button>
      </div>

      <FollowersDialog
        userId={userId}
        initialTab={tab}
        open={open}
        onOpenChange={setOpen}
        currentUserId={userId}
      />
    </>
  );
}
