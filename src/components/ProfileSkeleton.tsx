import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCardSkeleton } from "@/components/FeedSkeleton";

export function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="h-7 w-40 mt-4" />
                <Skeleton className="h-4 w-24 mt-2" />
                <Skeleton className="h-4 w-64 mt-3" />

                <div className="w-full mt-6">
                  <div className="flex justify-between mb-4">
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                    <Separator orientation="vertical" />
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                    <Separator orientation="vertical" />
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                </div>

                <Skeleton className="h-10 w-full mt-4 rounded-md" />

                <div className="w-full mt-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center sm:justify-start">
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>
          <div className="space-y-6">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
