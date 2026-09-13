'use client';

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getRandomUsers } from "@/actions/user.action";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import FollowButton from "./FollowButton";

type RandomUsers = Awaited<ReturnType<typeof getRandomUsers>>;

export default function WhoToFollowList({ initialUsers }: { initialUsers: RandomUsers }) {
  const { data: users } = useQuery({
    queryKey: queryKeys.users.whoToFollow(),
    queryFn: () => getRandomUsers(),
    initialData: initialUsers,
  });

  if (!users || users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2 text-center">
        No suggestions right now.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex gap-2 items-center justify-between">
          <div className="flex items-center gap-1">
            <Link href={`/profile/${user.username}`}>
              <Avatar>
                <AvatarImage src={user.image ?? "/avatar.png"} />
              </Avatar>
            </Link>
            <div className="text-xs">
              <Link href={`/profile/${user.username}`} className="font-medium cursor-pointer">
                {user.name}
              </Link>
              <p className="text-muted-foreground">@{user.username}</p>
              <p className="text-muted-foreground">{user._count.followers} followers</p>
            </div>
          </div>
          <FollowButton userId={user.id} />
        </div>
      ))}
    </div>
  );
}
