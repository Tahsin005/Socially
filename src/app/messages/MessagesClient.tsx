'use client';

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormattedConversation,
  getConversations,
  getOrCreateConversation,
} from "@/actions/message.action";
import ConversationList from "@/components/ConversationList";
import MessageThread from "@/components/MessageThread";
import NewChatDialog from "@/components/NewChatDialog";
import { Button } from "@/components/ui/button";
import { MessageSquareIcon, PlusIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import toast from "react-hot-toast";

interface MessagesClientProps {
  initialConversations: FormattedConversation[];
  currentUserId: string;
}

export default function MessagesClient({
  initialConversations,
  currentUserId,
}: MessagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversationId") || null
  );
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Poll conversations every 6 seconds
  const { data: conversations = initialConversations, isLoading } = useQuery({
    queryKey: queryKeys.messages.conversations(),
    queryFn: () => getConversations(),
    initialData: initialConversations,
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
  });

  // Handle URL query parameter ?userId=... (e.g., from Profile "Message" button)
  useEffect(() => {
    const targetUserId = searchParams.get("userId");
    if (!targetUserId) return;

    let isSubscribed = true;
    async function initConversationWithUser() {
      try {
        const res = await getOrCreateConversation(targetUserId!);
        if (res.success && res.conversation && isSubscribed) {
          queryClient.invalidateQueries({ queryKey: queryKeys.messages.conversations() });
          setSelectedConversationId(res.conversation.id);
          startTransition(() => {
            router.replace(`/messages?conversationId=${res.conversation.id}`);
          });
        } else if (!res.success) {
          toast.error(res.error || "Failed to open conversation");
        }
      } catch (error) {
        console.error("Failed to init conversation:", error);
      }
    }

    initConversationWithUser();
    return () => {
      isSubscribed = false;
    };
  }, [searchParams, router, queryClient]);

  const activeConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    startTransition(() => {
      router.replace(`/messages?conversationId=${id}`);
    });
  };

  const handleBackToConversations = () => {
    setSelectedConversationId(null);
    startTransition(() => {
      router.replace("/messages");
    });
  };

  return (
    <>
      <div className="h-[calc(100vh-8.5rem)] min-h-[560px] border border-border/80 rounded-2xl overflow-hidden bg-card/40 backdrop-blur-sm shadow-xs flex">
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border/60 flex-col shrink-0 ${
            selectedConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={() => setIsNewChatOpen(true)}
            currentUserId={currentUserId}
            isLoading={isLoading}
          />
        </div>

        <div
          className={`flex-1 flex-col ${
            selectedConversationId ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConversation ? (
            <MessageThread
              key={activeConversation.id}
              conversationId={activeConversation.id}
              otherUser={activeConversation.otherUser}
              currentUserId={currentUserId}
              onBack={handleBackToConversations}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 ring-1 ring-primary/20">
                <MessageSquareIcon className="size-8" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Your Messages</h3>
              <p className="text-sm max-w-sm mt-1 mb-5">
                Select an existing conversation or start a new chat to exchange direct messages in real time.
              </p>
              <Button
                onClick={() => setIsNewChatOpen(true)}
                className="rounded-xl shadow-xs"
              >
                <PlusIcon className="size-4 mr-1.5" />
                New Conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      <NewChatDialog
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        onSelectConversation={handleSelectConversation}
      />
    </>
  );
}
