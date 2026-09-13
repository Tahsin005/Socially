'use client';

import { useEffect, useRef, useState } from "react";
import {
  ConversationParticipant,
  getMessages,
  markMessagesAsRead,
  MessageWithSender,
  sendMessage,
} from "@/actions/message.action";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "./ui/message";
import { Bubble, BubbleContent } from "./ui/bubble";
import {
  CheckCheckIcon,
  CheckIcon,
  ChevronLeftIcon,
  Loader2Icon,
  SendIcon,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

interface MessageThreadProps {
  conversationId: string;
  otherUser: ConversationParticipant;
  currentUserId: string;
  onBack?: () => void;
}

export default function MessageThread({
  conversationId,
  otherUser,
  currentUserId,
  onBack,
}: MessageThreadProps) {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<MessageWithSender[]>([]);

  // 3-second smart polling while actively in this conversation
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.messages.thread(conversationId),
    queryFn: async () => {
      const res = await getMessages(conversationId);
      if (res.success && res.messages) {
        return res.messages;
      }
      return [];
    },
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const serverMessages = data || [];

  // Combine server messages with optimistic messages that aren't on the server yet
  const displayedMessages = [
    ...serverMessages,
    ...optimisticMessages.filter(
      (opt) => !serverMessages.some((srv) => srv.id === opt.id || (srv.content === opt.content && Math.abs(new Date(srv.createdAt).getTime() - new Date(opt.createdAt).getTime()) < 4000))
    ),
  ];

  // Mark messages as read on mount or when new messages arrive
  useEffect(() => {
    let isMounted = true;
    async function markRead() {
      if (!conversationId) return;
      const res = await markMessagesAsRead(conversationId);
      if (res.success && isMounted) {
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.unreadCount() });
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
      }
    }
    markRead();
    return () => {
      isMounted = false;
    };
  }, [conversationId, serverMessages.length, queryClient]);

  // Auto-scroll to bottom on load and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages.length]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      return await sendMessage(conversationId, text);
    },
    onMutate: (text) => {
      const tempId = `temp-${Date.now()}`;
      const tempMessage: MessageWithSender = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        content: text,
        isRead: false,
        createdAt: new Date(),
        sender: {
          id: currentUserId,
          name: "You",
          username: "you",
          image: null,
        },
      };
      setOptimisticMessages((prev) => [...prev, tempMessage]);
    },
    onSuccess: (result) => {
      if (result?.success && result.message) {
        // Sync server thread & conversation list
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(conversationId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      } else {
        toast.error(result?.error || "Failed to send message");
      }
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    },
    onSettled: () => {
      setOptimisticMessages([]);
    },
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;

    setInputText("");
    sendMutation.mutate(text);
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="p-3.5 px-4 border-b border-border/50 flex items-center justify-between bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-8 -ml-1 text-muted-foreground hover:text-foreground"
              onClick={onBack}
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
          )}

          <Link
            href={`/profile/${otherUser.username}`}
            className="flex items-center gap-3 group"
          >
            <Avatar className="size-10 border">
              <AvatarImage src={otherUser.image || "/avatar.png"} />
            </Avatar>
            <div>
              <p className="font-semibold text-sm leading-tight text-foreground group-hover:underline">
                {otherUser.name || otherUser.username}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                @{otherUser.username}
              </p>
            </div>
          </Link>
        </div>

        <Button variant="outline" size="sm" asChild className="text-xs h-8">
          <Link href={`/profile/${otherUser.username}`}>View Profile</Link>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            <Loader2Icon className="size-6 animate-spin text-primary mb-2" />
            Loading messages...
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
            <Avatar className="size-16 mb-3 border">
              <AvatarImage src={otherUser.image || "/avatar.png"} />
            </Avatar>
            <p className="font-semibold text-foreground text-base">
              {otherUser.name || otherUser.username}
            </p>
            <p className="text-xs text-muted-foreground mb-4">@{otherUser.username}</p>
            <p className="text-sm max-w-xs">
              This is the beginning of your direct conversation. Say hello!
            </p>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isOptimistic = msg.id.startsWith("temp-");

            let formattedTime = "";
            try {
              formattedTime = format(new Date(msg.createdAt), "h:mm a");
            } catch {
              formattedTime = "";
            }

            return (
              <Message key={msg.id} align={isMe ? "end" : "start"}>
                {!isMe && (
                  <MessageAvatar>
                    <Avatar className="size-7 border">
                      <AvatarImage src={otherUser.image || "/avatar.png"} alt={otherUser.username} />
                    </Avatar>
                  </MessageAvatar>
                )}

                <MessageContent>
                  <Bubble className={isOptimistic ? "opacity-75" : ""}>
                    <BubbleContent>{msg.content}</BubbleContent>
                  </Bubble>

                  <MessageFooter>
                    <span>{formattedTime}</span>
                    {isMe && (
                      <span title={isOptimistic ? "Sending..." : msg.isRead ? "Read" : "Sent"}>
                        {isOptimistic ? (
                          <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
                        ) : msg.isRead ? (
                          <CheckCheckIcon className="size-3.5 text-primary" />
                        ) : (
                          <CheckIcon className="size-3.5 text-muted-foreground" />
                        )}
                      </span>
                    )}
                  </MessageFooter>
                </MessageContent>
              </Message>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border/50 bg-card/60 backdrop-blur-xs">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 bg-background text-sm h-10 rounded-xl"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || sendMutation.isPending}
            className="size-10 rounded-xl shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
