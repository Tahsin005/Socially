import { getPostById } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return;

  return {
    title: `Post by ${post.author.name ?? post.author.username} | Socially`,
    description: post.content?.slice(0, 160) || `Check out ${post.author.username}'s post on Socially.`,
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, dbUserId] = await Promise.all([
    getPostById(id),
    getDbUserId(),
  ]);

  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            Back to Feed
          </Link>
        </Button>
      </div>

      <PostCard post={post} dbUserId={dbUserId} defaultShowComments={true} />
    </div>
  );
}
