'use client';

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchGlobal, SearchUser } from "@/actions/search.action";
import { PostWithDetails } from "@/actions/post.action";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Loader2Icon, SearchIcon, XIcon, ArrowRightIcon, UserIcon, FileTextIcon } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [prevSearchQuery, setPrevSearchQuery] = useState(query);

  if (query !== prevSearchQuery) {
    setPrevSearchQuery(query);
    if (!query.trim()) {
      setUsers([]);
      setPosts([]);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchGlobal(trimmed, 4);
        setUsers(results.users);
        setPosts(results.posts);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsOpen(false);
    inputRef.current?.blur();
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    });
  };

  const handleClear = () => {
    setQuery("");
    setUsers([]);
    setPosts([]);
    inputRef.current?.focus();
  };

  const hasResults = users.length > 0 || posts.length > 0;
  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center">
          {isLoading ? (
            <Loader2Icon className="size-4 animate-spin text-primary" />
          ) : (
            <SearchIcon className="size-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users or posts..."
          className="w-full h-9 pl-9 pr-16 text-sm rounded-full bg-muted/60 border border-input focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted border rounded pointer-events-none select-none">
              ⌘K
            </kbd>
          )}
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground border rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {isLoading && !hasResults && (
              <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                <span>Searching for &ldquo;{query}&rdquo;...</span>
              </div>
            )}

            {!isLoading && !hasResults && (
              <div className="p-6 text-center">
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  We couldn&apos;t find any people or posts matching &ldquo;{query}&rdquo;.
                </p>
              </div>
            )}

            {users.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="size-3.5" />
                  <span>People</span>
                </div>
                <div className="space-y-1 mt-1">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/70 transition-colors group"
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage src={user.image || "/avatar.png"} />
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {user.name ?? user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileTextIcon className="size-3.5" />
                  <span>Posts</span>
                </div>
                <div className="space-y-1 mt-1">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/70 transition-colors group"
                    >
                      <Avatar className="size-7 shrink-0 mt-0.5">
                        <AvatarImage src={post.author.image || "/avatar.png"} />
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground truncate">
                          {post.author.name} <span className="opacity-75">@{post.author.username}</span>
                        </p>
                        <p className="text-xs text-foreground/90 line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                          {post.content}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isPending}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted text-xs font-medium text-primary border-t border-border transition-colors cursor-pointer"
          >
            <span>See all results for &ldquo;{query}&rdquo;</span>
            <ArrowRightIcon className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
