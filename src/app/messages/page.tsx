import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { getDbUserId } from "@/actions/user.action";
import { getConversations } from "@/actions/message.action";
import MessagesClient from "./MessagesClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { MessageSquareIcon } from "lucide-react";

export const metadata = {
  title: "Messages | Socially",
  description: "Private direct messages with other users on Socially.",
};

export const dynamic = "force-dynamic";

async function MessagesContent() {
  const authUser = await currentUser();
  if (!authUser) {
    return (
      <Card className="max-w-md mx-auto mt-12 text-center p-6">
        <CardContent className="pt-6 space-y-4">
          <div className="size-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquareIcon className="size-6" />
          </div>
          <h2 className="text-xl font-bold">Sign in to view messages</h2>
          <p className="text-muted-foreground text-sm">
            You need to be signed in to send and receive direct messages.
          </p>
          <SignInButton mode="modal">
            <Button className="w-full">Sign In</Button>
          </SignInButton>
        </CardContent>
      </Card>
    );
  }

  const dbUserId = await getDbUserId();
  if (!dbUserId) return null;

  const initialConversations = await getConversations();

  return (
    <MessagesClient
      initialConversations={initialConversations}
      currentUserId={dbUserId}
    />
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-8.5rem)] min-h-[560px] border rounded-2xl bg-card/40 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading messages...</div>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
