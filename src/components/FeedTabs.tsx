"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFollowingPosts, getPosts, PostWithDetails } from "@/actions/post.action";
import PostCard from "@/components/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon, Loader2Icon, SparklesIcon, UsersIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { PostCardSkeleton } from "@/components/FeedSkeleton";

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

  const [forYouPosts, setForYouPosts] = useState<PostWithDetails[]>(initialPosts);
  const [forYouCursor, setForYouCursor] = useState<string | null>(initialNextCursor);
  const [isLoadingMoreForYou, setIsLoadingMoreForYou] = useState(false);

  const [prevInitialPosts, setPrevInitialPosts] = useState(initialPosts);
  if (prevInitialPosts !== initialPosts) {
    setPrevInitialPosts(initialPosts);
    setForYouPosts(initialPosts);
    setForYouCursor(initialNextCursor);
  }

  const [followingPosts, setFollowingPosts] = useState<PostWithDetails[] | null>(null);
  const [followingCursor, setFollowingCursor] = useState<string | null>(null);
  const [isInitialLoadingFollowing, setIsInitialLoadingFollowing] = useState(false);
  const [isLoadingMoreFollowing, setIsLoadingMoreFollowing] = useState(false);

  const forYouSentinelRef = useRef<HTMLDivElement | null>(null);
  const followingSentinelRef = useRef<HTMLDivElement | null>(null);

  const handleTabChange = async (val: string) => {
    const tab = val as "for-you" | "following";
    setActiveTab(tab);

    if (tab === "following" && isAuthenticated && followingPosts === null) {
      setIsInitialLoadingFollowing(true);
      try {
        const { posts, nextCursor } = await getFollowingPosts({ limit: 10 });
        setFollowingPosts(posts);
        setFollowingCursor(nextCursor);
      } catch (error) {
        console.error("Failed to load following posts:", error);
      } finally {
        setIsInitialLoadingFollowing(false);
      }
    }
  };

  const handleLoadMoreForYou = useCallback(async () => {
    if (!forYouCursor || isLoadingMoreForYou) return;
    setIsLoadingMoreForYou(true);
    try {
      const result = await getPosts({ cursor: forYouCursor, limit: 10 });
      setForYouPosts((prev) => [...prev, ...result.posts]);
      setForYouCursor(result.nextCursor);
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setIsLoadingMoreForYou(false);
    }
  }, [forYouCursor, isLoadingMoreForYou]);

  const handleLoadMoreFollowing = useCallback(async () => {
    if (!followingCursor || isLoadingMoreFollowing) return;
    setIsLoadingMoreFollowing(true);
    try {
      const result = await getFollowingPosts({ cursor: followingCursor, limit: 10 });
      setFollowingPosts((prev) => (prev ? [...prev, ...result.posts] : result.posts));
      setFollowingCursor(result.nextCursor);
    } catch (error) {
      console.error("Failed to load more following posts:", error);
    } finally {
      setIsLoadingMoreFollowing(false);
    }
  }, [followingCursor, isLoadingMoreFollowing]);

  useEffect(() => {
    if (activeTab !== "for-you" || !forYouCursor || isLoadingMoreForYou) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMoreForYou();
        }
      },
      { rootMargin: "200px" }
    );

    const currentSentinel = forYouSentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [activeTab, forYouCursor, isLoadingMoreForYou, handleLoadMoreForYou]);

  useEffect(() => {
    if (activeTab !== "following" || !followingCursor || isLoadingMoreFollowing) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMoreFollowing();
        }
      },
      { rootMargin: "200px" }
    );

    const currentSentinel = followingSentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [activeTab, followingCursor, isLoadingMoreFollowing, handleLoadMoreFollowing]);

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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

              {isLoadingMoreForYou && (
                <div className="space-y-6 py-2">
                  <PostCardSkeleton />
                </div>
              )}

              {forYouCursor ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreForYou}
                    disabled={isLoadingMoreForYou}
                    className="gap-2"
                  >
                    {isLoadingMoreForYou ? (
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
          ) : isInitialLoadingFollowing ? (
            <div className="space-y-6">
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : followingPosts && followingPosts.length > 0 ? (
            <>
              {followingPosts.map((post) => (
                <PostCard key={post.id} post={post} dbUserId={dbUserId} />
              ))}

              <div ref={followingSentinelRef} />

              {isLoadingMoreFollowing && (
                <div className="space-y-6 py-2">
                  <PostCardSkeleton />
                </div>
              )}

              {followingCursor ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreFollowing}
                    disabled={isLoadingMoreFollowing}
                    className="gap-2"
                  >
                    {isLoadingMoreFollowing ? (
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
