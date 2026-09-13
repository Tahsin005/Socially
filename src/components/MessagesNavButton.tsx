'use client';

import { MessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getUnreadMessagesCount } from "@/actions/message.action";

interface MessagesNavButtonProps {
  initialCount?: number;
  mobile?: boolean;
  onItemClick?: () => void;
}

export default function MessagesNavButton({
  initialCount = 0,
  mobile = false,
  onItemClick,
}: MessagesNavButtonProps) {
  const { data: unreadCount = initialCount } = useQuery({
    queryKey: queryKeys.messages.unreadCount(),
    queryFn: () => getUnreadMessagesCount(),
    initialData: initialCount,
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
  });

  if (mobile) {
    return (
      <Button
        variant="ghost"
        className="flex items-center gap-3 justify-start w-full"
        asChild
        onClick={onItemClick}
      >
        <Link href="/messages">
          <div className="relative flex items-center">
            <MessageSquareIcon className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <span>Messages</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" className="flex items-center gap-2" asChild>
      <Link href="/messages">
        <div className="relative flex items-center">
          <MessageSquareIcon className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Messages</span>
      </Link>
    </Button>
  );
}
