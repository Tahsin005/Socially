'use client';

import { useEffect, useRef, useState } from "react";
import {
  ConversationParticipant,
  FormattedConversation,
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

  // 3-second smart polling while actively in this conversation
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.messages.thread(conversationId),
    queryFn: async () => {
      const res = await getMessages(conversationId);
      if (res.success && res.messages) {
        // Retain any pending optimistic messages if a polling tick happens before mutation settles
        const currentData =
          queryClient.getQueryData<MessageWithSender[]>(
            queryKeys.messages.thread(conversationId)
          ) || [];
        const pendingOptimistic = currentData.filter((m) =>
          m.id.startsWith("temp-")
        );
        if (pendingOptimistic.length > 0) {
          const notYetOnServer = pendingOptimistic.filter(
            (opt) =>
              !res.messages.some(
                (srv) =>
                  srv.content === opt.content &&
                  Math.abs(
                    new Date(srv.createdAt).getTime() -
                      new Date(opt.createdAt).getTime()
                  ) < 10000
              )
          );
          return [...res.messages, ...notYetOnServer];
        }
        return res.messages;
      }
      return [];
    },
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const displayedMessages = data || [];

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
  }, [conversationId, displayedMessages.length, queryClient]);

  // Auto-scroll to bottom on load and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages.length]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      return await sendMessage(conversationId, text);
    },
    onMutate: async (text: string) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.thread(conversationId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.conversations() });

      const previousMessages = queryClient.getQueryData<MessageWithSender[]>(
        queryKeys.messages.thread(conversationId)
      );
      const previousConversations = queryClient.getQueryData<FormattedConversation[]>(
        queryKeys.messages.conversations()
      );

      const tempId = `temp-${Date.now()}`;
      const now = new Date();
      const tempMessage: MessageWithSender = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        content: text,
        isRead: false,
        createdAt: now,
        sender: {
          id: currentUserId,
          name: "You",
          username: "you",
          image: null,
        },
      };

      // Optimistically append the message to the thread in query cache
      queryClient.setQueryData<MessageWithSender[]>(
        queryKeys.messages.thread(conversationId),
        (old = []) => [...old, tempMessage]
      );

      // Optimistically update the conversation list in query cache
      queryClient.setQueryData<FormattedConversation[]>(
        queryKeys.messages.conversations(),
        (old = []) => {
          const existing = old.find((c) => c.id === conversationId);
          if (!existing) return old;
          const updated: FormattedConversation = {
            ...existing,
            lastMessage: {
              id: tempId,
              content: text,
              senderId: currentUserId,
              createdAt: now,
              isRead: false,
            },
            updatedAt: now,
          };
          return [updated, ...old.filter((c) => c.id !== conversationId)];
        }
      );

      return { previousMessages, previousConversations, tempId };
    },
    onSuccess: (result, text, context) => {
      if (result?.success && result.message) {
        // Seamlessly replace the tempMessage with the real server message in cache
        queryClient.setQueryData<MessageWithSender[]>(
          queryKeys.messages.thread(conversationId),
          (old = []) =>
            old.map((m) => (m.id === context?.tempId ? result.message! : m))
        );

        // Also update the conversation list item with the finalized message
        queryClient.setQueryData<FormattedConversation[]>(
          queryKeys.messages.conversations(),
          (old = []) =>
            old.map((c) => {
              if (c.id === conversationId && c.lastMessage?.id === context?.tempId) {
                return {
                  ...c,
                  lastMessage: {
                    id: result.message!.id,
                    content: result.message!.content,
                    senderId: result.message!.senderId,
                    createdAt: new Date(result.message!.createdAt),
                    isRead: result.message!.isRead,
                  },
                  updatedAt: new Date(result.message!.createdAt),
                };
              }
              return c;
            })
        );

        // Gently reconcile queries in the background
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(conversationId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      } else {
        // Rollback on failure
        if (context?.previousMessages) {
          queryClient.setQueryData(
            queryKeys.messages.thread(conversationId),
            context.previousMessages
          );
        }
        if (context?.previousConversations) {
          queryClient.setQueryData(
            queryKeys.messages.conversations(),
            context.previousConversations
          );
        }
        setInputText((current) => current || text);
        toast.error(result?.error || "Failed to send message");
      }
    },
    onError: (error, text, context) => {
      console.error("Failed to send message:", error);
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.thread(conversationId),
          context.previousMessages
        );
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.messages.conversations(),
          context.previousConversations
        );
      }
      setInputText((current) => current || text);
      toast.error("Failed to send message");
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
