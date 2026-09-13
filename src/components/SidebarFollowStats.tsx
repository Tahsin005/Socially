"use client";

import { useState } from "react";
import { Separator } from "./ui/separator";
import FollowersDialog from "./FollowersDialog";

interface SidebarFollowStatsProps {
  userId: string;
  followingCount: number;
  followersCount: number;
}

export default function SidebarFollowStats({
  userId,
  followingCount,
  followersCount,
}: SidebarFollowStatsProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");

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
