'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchUser } from "@/actions/search.action";
import { PostWithDetails } from "@/actions/post.action";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileTextIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

interface SearchPageClientProps {
  query: string;
  initialUsers: SearchUser[];
  initialPosts: PostWithDetails[];
  dbUserId: string | null;
  initialTab?: string;
}

export default function SearchPageClient({
  query,
  initialUsers,
  initialPosts,
  dbUserId,
  initialTab = "all",
}: SearchPageClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<string>(
    initialTab === "users" || initialTab === "posts" ? initialTab : "all"
  );
  const [users, setUsers] = useState<SearchUser[]>(initialUsers);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setSearchInput(query);
    setUsers(initialUsers);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}&tab=${activeTab}`);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&tab=${value}`);
    }
  };

  const handleClear = () => {
    setSearchInput("");
  };

  const hasSearch = query.trim().length > 0;
  const hasResults = users.length > 0 || initialPosts.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for people, keywords, or topics..."
                className="w-full h-11 pl-10 pr-10 text-sm rounded-lg bg-muted/50 border border-input focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="h-11 px-5">
              Search
            </Button>
          </form>

          {hasSearch && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Results for <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {users.length} {users.length === 1 ? "person" : "people"} · {initialPosts.length} {initialPosts.length === 1 ? "post" : "posts"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!hasSearch && (
        <Card className="border border-dashed py-16 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="size-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <SearchIcon className="size-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Search Socially</h2>
              <p className="text-sm text-muted-foreground">
                Discover creators by name or username, or search through discussions and posts by topic.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSearch && !hasResults && (
        <Card className="border py-16 text-center">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="size-16 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <SearchIcon className="size-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">No results found for &ldquo;{query}&rdquo;</h2>
              <p className="text-sm text-muted-foreground">
                Try checking for typos, using broader keywords, or searching for a specific username.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSearch && hasResults && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-11 bg-muted/60 p-1 rounded-lg">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <SparklesIcon className="size-4" />
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              <span>People ({users.length})</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileTextIcon className="size-4" />
              <span>Posts ({initialPosts.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-8">
            {users.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <UsersIcon className="size-4 text-primary" />
                    <span>People</span>
                  </h3>
                  {users.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabChange("users")}
                      className="text-xs text-primary"
                    >
                      View all {users.length}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {users.slice(0, 4).map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex items-start justify-between gap-3"
                    >
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex items-start gap-3 min-w-0 flex-1 group"
                      >
                        <Avatar className="size-11 shrink-0 border">
                          <AvatarImage src={user.image || "/avatar.png"} />
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate group-hover:underline">
                            {user.name ?? user.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                          {user.bio && (
                            <p className="text-xs text-foreground/80 line-clamp-1 mt-1">
                              {user.bio}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1.5">
                            {user._count.followers} followers · {user._count.posts} posts
                          </p>
                        </div>
                      </Link>

                      {dbUserId && dbUserId !== user.id && (
                        <FollowButton
                          userId={user.id}
                          initialIsFollowing={user.isFollowing}
                          onFollowToggle={(nextIsFollowing) => {
                            setUsers((prev) =>
                              prev.map((u) =>
                                u.id === user.id ? { ...u, isFollowing: nextIsFollowing } : u
                              )
                            );
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {initialPosts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <FileTextIcon className="size-4 text-primary" />
                    <span>Posts</span>
                  </h3>
                  {initialPosts.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabChange("posts")}
                      className="text-xs text-primary"
                    >
                      View all {initialPosts.length}
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {initialPosts.map((post) => (
                    <PostCard key={post.id} post={post} dbUserId={dbUserId} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex items-start justify-between gap-3"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-start gap-3 min-w-0 flex-1 group"
                    >
                      <Avatar className="size-12 shrink-0 border">
                        <AvatarImage src={user.image || "/avatar.png"} />
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate group-hover:underline">
                          {user.name ?? user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                        {user.bio && (
                          <p className="text-xs text-foreground/80 line-clamp-2 mt-1">
                            {user.bio}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {user._count.followers} followers · {user._count.following} following · {user._count.posts} posts
                        </p>
                      </div>
                    </Link>

                    {dbUserId && dbUserId !== user.id && (
                      <FollowButton
                        userId={user.id}
                        initialIsFollowing={user.isFollowing}
                        onFollowToggle={(nextIsFollowing) => {
                          setUsers((prev) =>
                            prev.map((u) =>
                              u.id === user.id ? { ...u, isFollowing: nextIsFollowing } : u
                            )
                          );
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No people found matching &ldquo;{query}&rdquo;
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            {initialPosts.length > 0 ? (
              <div className="space-y-4">
                {initialPosts.map((post) => (
                  <PostCard key={post.id} post={post} dbUserId={dbUserId} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No posts found matching &ldquo;{query}&rdquo;
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
