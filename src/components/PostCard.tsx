'use client';
import { createComment, deleteComment, deletePost, PostWithDetails, toggleBookmark, toggleLike } from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState, useRef, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { BookmarkIcon, HeartIcon, LogInIcon, MessageCircleIcon, SendIcon, Share2Icon, Trash2Icon } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { useRouter } from "next/navigation";
import { ReactionType } from "@/lib/validations";
import ReactionPicker, { REACTION_CONFIGS } from "./ReactionPicker";
import ReactionsDialog from "./ReactionsDialog";
import MentionText from "./MentionText";
import PollView from "./PollView";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

type Post = PostWithDetails;

interface PostCardProps {
    post: Post;
    dbUserId: string | null;
    defaultShowComments?: boolean;
}

function PostCard({ post, dbUserId, defaultShowComments = false }: PostCardProps) {
    const { user } = useUser();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [comments, setComments] = useState(post.comments);
    const [newComment, setNewComment] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);

    const initialReaction = (post.likes.find((like) => like.userId === dbUserId)?.type as ReactionType | undefined) ?? null;
    const [userReaction, setUserReaction] = useState<ReactionType | null>(initialReaction);
    const [likes, setLikes] = useState<Array<{ userId: string; type: ReactionType }>>(post.likes);
    const [isReacting, setIsReacting] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showReactionsDialog, setShowReactionsDialog] = useState(false);

    const [hasBookmarked, setHasBookmarked] = useState(
        post.bookmarks?.some((b) => b.userId === dbUserId) ?? false
    );
    const [isBookmarking, setIsBookmarking] = useState(false);
    const [showComments, setShowComments] = useState(defaultShowComments);

    useEffect(() => {
        setComments(post.comments);
        setLikes(post.likes);
        setUserReaction(
            (post.likes.find((like) => like.userId === dbUserId)?.type as ReactionType | undefined) ?? null
        );
        setHasBookmarked(post.bookmarks?.some((b) => b.userId === dbUserId) ?? false);
    }, [post, dbUserId]);

    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
        };
    }, []);

    const handleSelectReaction = async (targetType: ReactionType) => {
        if (!user || !dbUserId || isReacting) return;

        setShowReactionPicker(false);
        const previousReaction = userReaction;
        const previousLikes = [...likes];

        const isRemoving = previousReaction === targetType;
        const nextReaction = isRemoving ? null : targetType;

        setUserReaction(nextReaction);
        if (isRemoving) {
            setLikes((prev) => prev.filter((l) => l.userId !== dbUserId));
        } else if (previousReaction) {
            setLikes((prev) =>
                prev.map((l) => (l.userId === dbUserId ? { ...l, type: targetType } : l))
            );
        } else {
            setLikes((prev) => [...prev, { userId: dbUserId, type: targetType }]);
        }

        try {
            setIsReacting(true);
            const res = await toggleLike(post.id, targetType);
            if (!res?.success) {
                setUserReaction(previousReaction);
                setLikes(previousLikes);
                toast.error(res?.error || "Failed to update reaction");
            }
        } catch {
            setUserReaction(previousReaction);
            setLikes(previousLikes);
            toast.error("Failed to update reaction");
        } finally {
            setIsReacting(false);
        }
    };

    const handleDefaultReactClick = () => {
        if (!user) return;
        if (userReaction) {
            handleSelectReaction(userReaction);
        } else {
            handleSelectReaction("LIKE");
        }
    };

    const topReactionEmojis = useMemo(() => {
        if (likes.length === 0) return [];
        const typeCounts: Partial<Record<ReactionType, number>> = {};
        for (const l of likes) {
            const t = (l.type as ReactionType) || "LIKE";
            typeCounts[t] = (typeCounts[t] ?? 0) + 1;
        }
        const sortedTypes = (Object.keys(typeCounts) as ReactionType[]).sort(
            (a, b) => (typeCounts[b] ?? 0) - (typeCounts[a] ?? 0)
        );
        return sortedTypes.slice(0, 3).map((t) => REACTION_CONFIGS[t]?.emoji ?? "❤️");
    }, [likes]);

    const handleReactionMouseEnter = () => {
        if (!user) return;
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setShowReactionPicker(true);
        }, 220);
    };

    const handleReactionMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setShowReactionPicker(false);
        }, 280);
    };


    const handleAddComment = async () => {
        if (!newComment.trim() || isCommenting) return;
        try {
            setIsCommenting(true);
            const result = await createComment(post.id, newComment);
            if (result?.success && result.comment) {
                setComments((prev) => [...prev, result.comment]);
                setNewComment("");
                toast.success("Comment posted successfully");
            } else {
                toast.error(result?.error || "Failed to add comment");
            }
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsCommenting(false);
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (isDeletingCommentId) return;
        try {
            setIsDeletingCommentId(commentId);
            const result = await deleteComment(commentId);
            if (result?.success) {
                setComments((prev) => prev.filter((c) => c.id !== commentId));
                toast.success("Comment deleted");
            } else {
                toast.error(result?.error || "Failed to delete comment");
            }
        } catch (error) {
            toast.error("Failed to delete comment");
        } finally {
            setIsDeletingCommentId(null);
        }
    }

    const handleDeletePost = async () => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            const result = await deletePost(post.id);
            if (result.success) {
                toast.success("Post deleted successfully");
                // Invalidate all post queries so it vanishes across feeds and profiles immediately
                queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
                router.refresh();

                if (typeof window !== "undefined" && window.location.pathname.startsWith(`/post/${post.id}`)) {
                    router.push("/");
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error("Failed to delete post");
        } finally {
            setIsDeleting(false);
        }
    }

    const handleShare = async () => {
        try {
            const postUrl = `${window.location.origin}/post/${post.id}`;
            if (navigator.share) {
                await navigator.share({
                    title: `Post by ${post.author.name}`,
                    text: post.content || undefined,
                    url: postUrl,
                });
            } else {
                await navigator.clipboard.writeText(postUrl);
                toast.success("Post link copied to clipboard!");
            }
        } catch {
            try {
                await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                toast.success("Post link copied to clipboard!");
            } catch {
                toast.error("Failed to copy link");
            }
        }
    };

    const handleBookmark = async () => {
        if (isBookmarking) return;

        try {
            setIsBookmarking(true);
            setHasBookmarked((prev) => !prev);

            const res = await toggleBookmark(post.id);
            if (res?.success && typeof res.isBookmarked === "boolean") {
                setHasBookmarked(res.isBookmarked);
                toast.success(res.isBookmarked ? "Post saved to bookmarks" : "Post removed from bookmarks");
                if (dbUserId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.posts.bookmarks(dbUserId) });
                }
                router.refresh();
            } else {
                setHasBookmarked(post.bookmarks?.some((b) => b.userId === dbUserId) ?? false);
                toast.error(res?.error || "Failed to bookmark post");
            }
        } catch {
            setHasBookmarked(post.bookmarks?.some((b) => b.userId === dbUserId) ?? false);
            toast.error("Failed to bookmark post");
        } finally {
            setIsBookmarking(false);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                    <div className="flex space-x-3 sm:space-x-4">
                        <Link href={`/profile/${post.author.username}`}>
                            <Avatar className="size-8 sm:w-10 sm:h-10">
                                <AvatarImage src={post.author.image ?? "/avatar.png"} />
                            </Avatar>
                        </Link>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                                    <Link
                                        href={`/profile/${post.author.username}`}
                                        className="font-semibold truncate"
                                    >
                                        {post.author.name}
                                    </Link>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Link href={`/profile/${post.author.username}`}>@{post.author.username}</Link>
                                        <span>•</span>
                                        <Link href={`/post/${post.id}`} className="hover:underline">
                                            {formatDistanceToNow(new Date(post.createdAt))} ago
                                        </Link>
                                    </div>
                                </div>
                                {dbUserId === post.author.id && (
                                    <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                                )}
                            </div>
                            <p className="mt-2 text-sm text-foreground break-words">
                                <MentionText content={post.content} />
                            </p>
                        </div>
                    </div>

                    {post.image && (
                        <div className="rounded-lg overflow-hidden">
                            <img src={post.image} alt="Post content" className="w-full h-auto object-cover" />
                        </div>
                    )}

                    {post.poll && (
                        <PollView poll={post.poll} currentUserId={dbUserId} />
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <div
                                className="relative flex items-center"
                                onMouseEnter={handleReactionMouseEnter}
                                onMouseLeave={handleReactionMouseLeave}
                            >
                                {user ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`gap-1.5 px-2.5 transition-all duration-150 ${
                                            userReaction
                                                ? REACTION_CONFIGS[userReaction]?.activeClass ?? "text-rose-500"
                                                : "text-muted-foreground hover:text-rose-500"
                                        }`}
                                        onClick={handleDefaultReactClick}
                                        onTouchStart={() => {
                                            longPressTimeoutRef.current = setTimeout(() => {
                                                setShowReactionPicker(true);
                                            }, 350);
                                        }}
                                        onTouchEnd={() => {
                                            if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
                                        }}
                                    >
                                        {userReaction ? (
                                            userReaction === "LIKE" ? (
                                                <HeartIcon className="size-5 fill-current text-rose-500" />
                                            ) : (
                                                <span className="text-lg leading-none transform active:scale-125 transition-transform">
                                                    {REACTION_CONFIGS[userReaction]?.emoji}
                                                </span>
                                            )
                                        ) : (
                                            <HeartIcon className="size-5" />
                                        )}
                                        <span className="text-xs font-semibold hidden sm:inline">
                                            {userReaction ? REACTION_CONFIGS[userReaction]?.label : "Like"}
                                        </span>
                                    </Button>
                                ) : (
                                    <SignInButton mode="modal">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 px-2.5">
                                            <HeartIcon className="size-5" />
                                            <span className="text-xs font-semibold hidden sm:inline">Like</span>
                                        </Button>
                                    </SignInButton>
                                )}

                                {likes.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowReactionsDialog(true)}
                                        title="View reactions"
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-muted/60"
                                    >
                                        <span className="flex -space-x-1 items-center">
                                            {topReactionEmojis.map((emoji, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-block transform hover:scale-125 transition-transform select-none"
                                                >
                                                    {emoji}
                                                </span>
                                            ))}
                                        </span>
                                        <span className="font-semibold tabular-nums ml-0.5">{likes.length}</span>
                                    </button>
                                )}

                                {showReactionPicker && (
                                    <ReactionPicker
                                        currentReaction={userReaction}
                                        onSelectReaction={handleSelectReaction}
                                        onClose={() => setShowReactionPicker(false)}
                                    />
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground gap-2 hover:text-blue-500"
                                onClick={() => setShowComments((prev) => !prev)}
                            >
                                <MessageCircleIcon
                                    className={`size-5 ${showComments ? "fill-blue-500 text-blue-500" : ""}`}
                                />
                                <span>{comments.length}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground gap-2 hover:text-green-500"
                                onClick={handleShare}
                                title="Share post"
                            >
                                <Share2Icon className="size-5" />
                                <span className="hidden sm:inline text-xs">Share</span>
                            </Button>
                        </div>

                        {user ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`text-muted-foreground gap-2 ${
                                    hasBookmarked ? "text-primary hover:text-primary/80" : "hover:text-primary"
                                }`}
                                onClick={handleBookmark}
                                title={hasBookmarked ? "Remove bookmark" : "Bookmark post"}
                            >
                                <BookmarkIcon className={`size-5 ${hasBookmarked ? "fill-current" : ""}`} />
                                <span className="hidden sm:inline text-xs">{hasBookmarked ? "Saved" : "Save"}</span>
                            </Button>
                        ) : (
                            <SignInButton mode="modal">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground gap-2 hover:text-primary"
                                    title="Sign in to bookmark"
                                >
                                    <BookmarkIcon className="size-5" />
                                    <span className="hidden sm:inline text-xs">Save</span>
                                </Button>
                            </SignInButton>
                        )}
                    </div>

                    {showComments && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex space-x-3 group">
                                        <Link href={`/profile/${comment.author.username}`}>
                                            <Avatar className="size-8 flex-shrink-0 hover:opacity-80 transition-opacity">
                                                <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                                            </Avatar>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <Link
                                                        href={`/profile/${comment.author.username}`}
                                                        className="font-medium text-sm hover:underline"
                                                    >
                                                        {comment.author.name}
                                                    </Link>
                                                    <Link
                                                        href={`/profile/${comment.author.username}`}
                                                        className="text-sm text-muted-foreground hover:underline"
                                                    >
                                                        @{comment.author.username}
                                                    </Link>
                                                    <span className="text-sm text-muted-foreground">·</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDistanceToNow(new Date(comment.createdAt))} ago
                                                    </span>
                                                </div>
                                                {(dbUserId === comment.author.id || dbUserId === post.author.id) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-muted-foreground hover:text-red-500 opacity-80 hover:opacity-100"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        disabled={isDeletingCommentId === comment.id}
                                                    >
                                                        <Trash2Icon className="size-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-sm break-words mt-0.5">
                                                <MentionText content={comment.content} />
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {user ? (
                                <div className="flex space-x-3">
                                    <Avatar className="size-8 flex-shrink-0">
                                        <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea
                                            placeholder="Write a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="min-h-[80px] resize-none"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                size="sm"
                                                onClick={handleAddComment}
                                                className="flex items-center gap-2"
                                                disabled={!newComment.trim() || isCommenting}
                                            >
                                                {isCommenting ? (
                                                    "Posting..."
                                                ) : (
                                                    <>
                                                        <SendIcon className="size-4" />
                                                        Comment
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                                    <SignInButton mode="modal">
                                        <Button variant="outline" className="gap-2">
                                            <LogInIcon className="size-4" />
                                            Sign in to comment
                                        </Button>
                                    </SignInButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
            <ReactionsDialog
                postId={post.id}
                open={showReactionsDialog}
                onOpenChange={setShowReactionsDialog}
                currentUserId={dbUserId}
            />
        </Card>
    )
}

export default PostCard