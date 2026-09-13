import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex space-x-3 sm:space-x-4">
          <Skeleton className="size-8 sm:w-10 sm:h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <div className="flex items-center gap-4 pt-2 border-t">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CreatePostSkeleton() {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6 space-y-4">
        <div className="flex space-x-4">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <Skeleton className="flex-1 h-20 rounded-md" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WhoToFollowSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6 space-y-6">
        <CreatePostSkeleton />
        <div className="space-y-6">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <WhoToFollowSkeleton />
      </div>
    </div>
  );
}
