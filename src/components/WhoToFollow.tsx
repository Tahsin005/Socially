import { getRandomUsers } from "@/actions/user.action";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import FollowButton from "./FollowButton";

import WhoToFollowList from "./WhoToFollowList";

async function WhoToFollow() {
  const users = await getRandomUsers();

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>About Socially</CardTitle>
        </CardHeader>
        <CardContent className="text-md text-muted-foreground space-y-2">
          <p>
            Welcome to <span className="font-semibold">Socially</span> —
            a place to connect, share, and grow together.
          </p>
          <p>
            Follow people you like, stay updated, and build your network.
            New user suggestions will appear here soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who to Follow</CardTitle>
      </CardHeader>
      <CardContent>
        <WhoToFollowList initialUsers={users} />
      </CardContent>
    </Card>
  );
}

export default WhoToFollow;
