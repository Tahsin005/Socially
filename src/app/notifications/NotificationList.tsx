import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return <HeartIcon className="size-4 text-red-500" />;
    case "COMMENT":
      return <MessageCircleIcon className="size-4 text-blue-500" />;
    case "FOLLOW":
      return <UserPlusIcon className="size-4 text-green-500" />;
    default:
      return null;
  }
};

import Link from "next/link";

export default async function NotificationList() {
  const notifications = await getNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
  if (unreadIds.length > 0) await markNotificationsAsRead(unreadIds);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {notifications.length} total
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors ${
                  !notification.read ? "bg-muted/50" : ""
                }`}
              >
                <Link href={`/profile/${notification.creator.username}`}>
                  <Avatar className="mt-1 hover:opacity-80 transition-opacity">
                    <AvatarImage src={notification.creator.image ?? "/avatar.png"} />
                  </Avatar>
                </Link>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <span>
                      <Link
                        href={`/profile/${notification.creator.username}`}
                        className="font-medium hover:underline"
                      >
                        {notification.creator.name ?? notification.creator.username}
                      </Link>{" "}
                      {notification.type === "FOLLOW"
                        ? "started following you"
                        : notification.type === "LIKE"
                        ? "liked your post"
                        : "commented on your post"}
                    </span>
                  </div>

                  {notification.post &&
                  (notification.type === "LIKE" || notification.type === "COMMENT") && (
                    <div className="pl-6 space-y-2">
                      <Link
                        href={`/post/${notification.postId}`}
                        className="block text-sm text-muted-foreground rounded-md p-2 bg-muted/30 mt-2 hover:bg-muted/60 transition-colors"
                      >
                        <p>{notification.post.content}</p>
                        {notification.post.image && (
                          <img
                            src={notification.post.image}
                            alt="Post content"
                            className="mt-2 rounded-md w-full max-w-[200px] h-auto object-cover"
                          />
                        )}
                      </Link>

                      {notification.type === "COMMENT" && notification.comment && (
                        <div className="text-sm p-2 bg-accent/50 rounded-md">
                          {notification.comment.content}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground pl-6">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
