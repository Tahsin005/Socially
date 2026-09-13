'use server';

import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";
import prisma from "@/lib/prisma";
import { createCommentSchema, createPostSchema, CreatePollInput, ReactionType, reactionTypeSchema } from "@/lib/validations";
import { extractMentions } from "@/lib/mention";
import { postInclude } from "@/lib/postInclude";

export type PostWithDetails = NonNullable<Awaited<ReturnType<typeof getPostById>>>;

export async function createPost(content: string, image: string, poll?: CreatePollInput) {
    try {
        const userId = await getDbUserId();

        if (!userId) return { success: false, error: "Unauthorized" };

        const validation = createPostSchema.safeParse({ content, image, poll });
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0]?.message || "Invalid input" };
        }

        const post = await prisma.post.create({
            data: {
                content: validation.data.content,
                image: validation.data.image || null,
                authorId: userId,
                ...(validation.data.poll
                    ? {
                          poll: {
                              create: {
                                  expiresAt: new Date(Date.now() + validation.data.poll.durationHours * 60 * 60 * 1000),
                                  options: {
                                      create: validation.data.poll.options.map((text) => ({ text })),
                                  },
                              },
                          },
                      }
                    : {}),
            },
            include: postInclude,
        });

        // Notify mentioned users
        const mentionedUsernames = extractMentions(validation.data.content);
        if (mentionedUsernames.length > 0) {
            const mentionedUsers = await prisma.user.findMany({
                where: {
                    username: {
                        in: mentionedUsernames,
                        mode: "insensitive",
                    },
                    id: {
                        not: userId, // Don't notify self
                    },
                },
                select: {
                    id: true,
                },
            });

            if (mentionedUsers.length > 0) {
                await prisma.notification.createMany({
                    data: mentionedUsers.map((u) => ({
                        type: "MENTION",
                        userId: u.id,
                        creatorId: userId,
                        postId: post.id,
                    })),
                });
            }
        }

        revalidatePath("/");
        return { success: true, post };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { success: false, error: "Failed to create post" };
    }
}

export async function getPosts(options?: { cursor?: string; limit?: number }) {
    try {
        const limit = options?.limit ?? 10;
        const cursor = options?.cursor;

        const posts = await prisma.post.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
            orderBy: {
                createdAt: "desc",
            },
            include: postInclude,
        });

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        return {
            posts: items,
            nextCursor,
        };
    } catch (error) {
        console.log("Error in getPosts", error);
        throw new Error("Failed to fetch posts");
    }
}

export async function getPostById(postId: string) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: postInclude,
        });

        return post;
    } catch (error) {
        console.error("Error in getPostById:", error);
        return null;
    }
}

export async function getFollowingPosts(options?: { cursor?: string; limit?: number }) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { posts: [], nextCursor: null };

        const limit = options?.limit ?? 10;
        const cursor = options?.cursor;

        const posts = await prisma.post.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
            where: {
                author: {
                    followers: {
                        some: {
                            followerId: userId,
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            include: postInclude,
        });

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore ? items[items.length - 1].id : null;

        return {
            posts: items,
            nextCursor,
        };
    } catch (error) {
        console.error("Error in getFollowingPosts:", error);
        return { posts: [], nextCursor: null };
    }
}

export async function toggleLike(postId: string, reactionType?: ReactionType) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        const targetReaction: ReactionType = reactionType && reactionTypeSchema.safeParse(reactionType).success
            ? reactionType
            : "LIKE";

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true },
        });

        if (!post) throw new Error("Post not found");

        if (existingLike) {
            // If user clicked the same reaction, remove it (toggle off)
            if (existingLike.type === targetReaction && (!reactionType || reactionType === existingLike.type)) {
                await prisma.like.delete({
                    where: {
                        userId_postId: {
                            userId,
                            postId,
                        },
                    },
                });
                revalidatePath("/");
                return { success: true, reaction: null };
            } else {
                // If user selected a different reaction, update it
                const updated = await prisma.like.update({
                    where: {
                        userId_postId: {
                            userId,
                            postId,
                        },
                    },
                    data: {
                        type: targetReaction,
                    },
                });
                revalidatePath("/");
                return { success: true, reaction: updated.type as ReactionType };
            }
        } else {
            // User creating a new reaction
            await prisma.$transaction([
                prisma.like.create({
                    data: {
                        userId,
                        postId,
                        type: targetReaction,
                    },
                }),
                ...(post.authorId !== userId
                    ? [
                        prisma.notification.create({
                            data: {
                                type: "LIKE",
                                userId: post.authorId,
                                creatorId: userId,
                                postId,
                            },
                        }),
                    ]
                    : []),
            ]);

            revalidatePath("/");
            return { success: true, reaction: targetReaction };
        }
    } catch (error) {
        console.error("Failed to toggle reaction:", error);
        return { success: false, error: "Failed to toggle reaction" };
    }
}

export async function getPostReactions(postId: string) {
    try {
        const currentUserId = await getDbUserId();

        const reactions = await prisma.like.findMany({
            where: { postId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        bio: true,
                        followers: currentUserId
                            ? {
                                  where: {
                                      followerId: currentUserId,
                                  },
                                  select: {
                                      followerId: true,
                                  },
                              }
                            : false,
                        _count: {
                            select: {
                                followers: true,
                                following: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return reactions.map((r) => ({
            ...r.user,
            reactionType: r.type as ReactionType,
            isFollowing: currentUserId ? (r.user.followers?.length ?? 0) > 0 : false,
        }));
    } catch (error) {
        console.error("Error fetching post reactions:", error);
        return [];
    }
}


export async function createComment(postId: string, content: string) {
    try {
        const userId = await getDbUserId();

        if (!userId) return { success: false, error: "Unauthorized" };

        const validation = createCommentSchema.safeParse({ postId, content });
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0]?.message || "Invalid input" };
        }

        const post = await prisma.post.findUnique({
            where: { id: validation.data.postId },
            select: { authorId: true },
        });

        if (!post) throw new Error("Post not found");

        const mentionedUsernames = extractMentions(validation.data.content);
        const mentionedUsers = mentionedUsernames.length > 0
            ? await prisma.user.findMany({
                where: {
                    username: {
                        in: mentionedUsernames,
                        mode: "insensitive",
                    },
                    id: {
                        not: userId, // Don't notify self
                    },
                },
                select: {
                    id: true,
                },
            })
            : [];

        const [comment] = await prisma.$transaction(async (tx) => {
            const newComment = await tx.comment.create({
                data: {
                    content: validation.data.content,
                    authorId: userId,
                    postId: validation.data.postId,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                        },
                    },
                },
            });

            // Create MENTION notifications for mentioned users
            for (const u of mentionedUsers) {
                await tx.notification.create({
                    data: {
                        type: "MENTION",
                        userId: u.id,
                        creatorId: userId,
                        postId: validation.data.postId,
                        commentId: newComment.id,
                    },
                });
            }

            // Create COMMENT notification for post author only if they weren't already notified via MENTION
            const isAuthorMentioned = mentionedUsers.some((u) => u.id === post.authorId);
            if (post.authorId !== userId && !isAuthorMentioned) {
                await tx.notification.create({
                    data: {
                        type: "COMMENT",
                        userId: post.authorId,
                        creatorId: userId,
                        postId: validation.data.postId,
                        commentId: newComment.id,
                    },
                });
            }

            return [newComment];
        });

        revalidatePath(`/`);
        return { success: true, comment };
    } catch (error) {
        console.error("Failed to create comment:", error);
        return { success: false, error: "Failed to create comment" };
    }
}

export async function deleteComment(commentId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                authorId: true,
                postId: true,
                post: {
                    select: { authorId: true },
                },
            },
        });

        if (!comment) return { success: false, error: "Comment not found" };

        if (comment.authorId !== userId && comment.post.authorId !== userId) {
            return { success: false, error: "Unauthorized - no delete permission" };
        }

        await prisma.comment.delete({
            where: { id: commentId },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete comment:", error);
        return { success: false, error: "Failed to delete comment" };
    }
}

export async function deletePost(postId: string) {
    try {
        const userId = await getDbUserId();

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true },
        });

        if (!post) throw new Error("Post not found");
        if (post.authorId !== userId) throw new Error("Unauthorized - no delete permission");

        await prisma.post.delete({
            where: { id: postId },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete post:", error);
        return { success: false, error: "Failed to delete post" };
    }
}

export async function toggleBookmark(postId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        const existingBookmark = await prisma.bookmark.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        if (existingBookmark) {
            await prisma.bookmark.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            revalidatePath("/");
            revalidatePath("/profile");
            return { success: true, isBookmarked: false };
        } else {
            await prisma.bookmark.create({
                data: {
                    userId,
                    postId,
                },
            });
            revalidatePath("/");
            revalidatePath("/profile");
            return { success: true, isBookmarked: true };
        }
    } catch (error) {
        console.error("Failed to toggle bookmark:", error);
        return { success: false, error: "Failed to toggle bookmark" };
    }
}

export async function getUserBookmarkedPosts(userId: string) {
    try {
        const bookmarkedPosts = await prisma.post.findMany({
            where: {
                bookmarks: {
                    some: {
                        userId,
                    },
                },
            },
            include: postInclude,
            orderBy: {
                createdAt: "desc",
            },
        });

        return bookmarkedPosts;
    } catch (error) {
        console.error("Error fetching bookmarked posts:", error);
        return [];
    }
}

export async function votePoll(pollId: string, pollOptionId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: { expiresAt: true, options: { select: { id: true } } },
        });

        if (!poll) return { success: false, error: "Poll not found" };

        if (new Date(poll.expiresAt) < new Date()) {
            return { success: false, error: "This poll has ended" };
        }

        if (!poll.options.some((option) => option.id === pollOptionId)) {
            return { success: false, error: "Invalid poll option" };
        }

        const existingVote = await prisma.pollVote.findUnique({
            where: {
                userId_pollId: {
                    userId,
                    pollId,
                },
            },
        });

        if (existingVote) {
            return { success: false, error: "You have already voted on this poll" };
        }

        await prisma.pollVote.create({
            data: {
                pollId,
                pollOptionId,
                userId,
            },
        });

        revalidatePath("/");
        return { success: true, pollOptionId };
    } catch (error) {
        console.error("Failed to vote on poll:", error);
        return { success: false, error: "Failed to submit vote" };
    }
}
