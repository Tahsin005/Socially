"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFollowingPosts, getPosts, PostWithDetails } from "@/actions/post.action";
import PostCard from "@/components/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, Loader2Icon, SparklesIcon, UsersIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { PostCardSkeleton } from "@/components/FeedSkeleton";
import { queryKeys } from "@/lib/queryKeys";

interface FeedTabsProps {
  initialPosts: PostWithDetails[];
  initialNextCursor: string | null;
  dbUserId: string | null;
  isAuthenticated: boolean;
}

export default function FeedTabs({
  initialPosts,
  initialNextCursor,
  dbUserId,
  isAuthenticated,
}: FeedTabsProps) {
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");

  const forYouSentinelRef = useRef<HTMLDivElement | null>(null);
  const followingSentinelRef = useRef<HTMLDivElement | null>(null);

  // For You infinite query (hydrated with initial server data)
  const {
    data: forYouData,
    fetchNextPage: fetchNextForYou,
    hasNextPage: hasNextForYou,
    isFetchingNextPage: isFetchingNextForYou,
  } = useInfiniteQuery({
    queryKey: queryKeys.posts.forYou(),
    queryFn: ({ pageParam }) =>
      getPosts({ cursor: pageParam ?? undefined, limit: 10 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: {
      pages: [{ posts: initialPosts, nextCursor: initialNextCursor }],
      pageParams: [null],
    },
  });

  // Following infinite query (auto-refetched when invalidated)
  const {
    data: followingData,
    fetchNextPage: fetchNextFollowing,
    hasNextPage: hasNextFollowing,
    isFetchingNextPage: isFetchingNextFollowing,
    isLoading: isLoadingFollowing,
  } = useInfiniteQuery({
    queryKey: queryKeys.posts.following(),
    queryFn: ({ pageParam }) =>
      getFollowingPosts({ cursor: pageParam ?? undefined, limit: 10 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated && activeTab === "following",
  });

  const forYouPosts = forYouData?.pages.flatMap((page) => page.posts) ?? [];
  const followingPosts = followingData?.pages.flatMap((page) => page.posts) ?? [];

  // Infinite scroll observer for 'For You'
  useEffect(() => {
    if (activeTab !== "for-you" || !hasNextForYou || isFetchingNextForYou) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextForYou();
        }
      },
      { rootMargin: "200px" }
    );

    const currentSentinel = forYouSentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [activeTab, hasNextForYou, isFetchingNextForYou, fetchNextForYou]);

  // Infinite scroll observer for 'Following'
  useEffect(() => {
    if (activeTab !== "following" || !hasNextFollowing || isFetchingNextFollowing) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextFollowing();
        }
      },
      { rootMargin: "200px" }
    );

    const currentSentinel = followingSentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [activeTab, hasNextFollowing, isFetchingNextFollowing, fetchNextFollowing]);

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "for-you" | "following")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/60 p-1">
          <TabsTrigger
            value="for-you"
            className="flex items-center gap-2 font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <SparklesIcon className="size-4" />
            For You
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="flex items-center gap-2 font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <UsersIcon className="size-4" />
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="space-y-6 mt-0">
          {forYouPosts.length > 0 ? (
            <>
              {forYouPosts.map((post) => (
                <PostCard key={post.id} post={post} dbUserId={dbUserId} />
              ))}

              <div ref={forYouSentinelRef} />

              {isFetchingNextForYou && (
                <div className="space-y-6 py-2">
                  <PostCardSkeleton />
                </div>
              )}

              {hasNextForYou ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextForYou()}
                    disabled={isFetchingNextForYou}
                    className="gap-2"
                  >
                    {isFetchingNextForYou ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin" />
                        Loading more posts...
                      </>
                    ) : (
                      "Load More Posts"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <span className="h-px w-12 bg-border" />
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2Icon className="size-3.5 text-primary" />
                    You&apos;re all caught up
                  </span>
                  <span className="h-px w-12 bg-border" />
                </div>
              )}
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              No posts in the feed yet. Be the first to share something!
            </Card>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-6 mt-0">
          {!isAuthenticated ? (
            <Card className="p-8 text-center space-y-4">
              <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UsersIcon className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Follow people you care about</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Sign in to see posts from the accounts and creators you follow.
                </p>
              </div>
              <SignInButton mode="modal">
                <Button variant="default">Sign In to Continue</Button>
              </SignInButton>
            </Card>
          ) : isLoadingFollowing && followingPosts.length === 0 ? (
            <div className="space-y-6">
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : followingPosts.length > 0 ? (
            <>
              {followingPosts.map((post) => (
                <PostCard key={post.id} post={post} dbUserId={dbUserId} />
              ))}

              <div ref={followingSentinelRef} />

              {isFetchingNextFollowing && (
                <div className="space-y-6 py-2">
                  <PostCardSkeleton />
                </div>
              )}

              {hasNextFollowing ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextFollowing()}
                    disabled={isFetchingNextFollowing}
                    className="gap-2"
                  >
                    {isFetchingNextFollowing ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin" />
                        Loading more posts...
                      </>
                    ) : (
                      "Load More Posts"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <span className="h-px w-12 bg-border" />
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2Icon className="size-3.5 text-primary" />
                    You&apos;re all caught up
                  </span>
                  <span className="h-px w-12 bg-border" />
                </div>
              )}
            </>
          ) : (
            <Card className="p-8 text-center space-y-4">
              <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <UsersIcon className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">No posts yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  You aren&apos;t following anyone yet or the people you follow haven&apos;t posted anything yet.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
