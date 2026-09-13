import { PostCardSkeleton } from "@/components/FeedSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-9 w-32 rounded-md" />
      <PostCardSkeleton />
    </div>
  );
}
