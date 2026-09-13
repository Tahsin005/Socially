'use server';

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) return;

        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: userId,
            },
        });

        if (existingUser) return existingUser;

        const email = user.emailAddresses[0]?.emailAddress ?? `${userId}@socially.local`;
        const username =
            user.username ??
            user.emailAddresses[0]?.emailAddress?.split("@")[0] ??
            userId;

        const dbUser = await prisma.user.create({
            data: {
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || username,
                username,
                email,
                image: user.imageUrl,
            },
        });

        return dbUser;
    } catch (error) {
        console.log("Error in syncUser", error);
    }
}

export async function getUserByClerkId(clerkId: string) {
    return prisma.user.findUnique({
        where: {
            clerkId: clerkId,
        },
        include: {
            _count: {
                select: {
                    followers: true,
                    following: true,
                    posts: true,
                },
            },
        },
    });
}

export async function getDbUserId() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const user = await getUserByClerkId(clerkId);
    if (user) return user.id;

    const synced = await syncUser();
    return synced?.id ?? null;
}

export async function getRandomUsers() {
    try {
        const userId = await getDbUserId();

        if (!userId) return [];
        const randomUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },
                    {
                    NOT: {
                        followers: {
                            some: {
                                followerId: userId,
                            },
                        },
                    },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true,
                    },
                },
            },
            take: 3,
        });

        return randomUsers;
    } catch (error) {
        console.log("Error fetching random users", error);
        return [];
    }
}

export async function toggleFollow(targetUserId: string) {
    try {
        const userId = await getDbUserId();

        if (!userId) return null;

        if (targetUserId === userId) throw new Error('You cannot follow yourself');

        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId,
                }
            }
        });

        if (existingFollow) {
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                },
            });
            revalidatePath("/");
            revalidatePath("/profile");
            return { success: true, isFollowing: false };
        } else {
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: userId,
                        followingId: targetUserId,
                    },
                }),

                prisma.notification.create({
                    data: {
                        type: "FOLLOW",
                        userId: targetUserId,
                        creatorId: userId,
                    },
                }),
            ]);
            revalidatePath("/");
            revalidatePath("/profile");
            return { success: true, isFollowing: true };
        }
    } catch (error) {
        console.log("Error in toggleFollow", error);
        return { success: false, error: "Error toggling follow" };
    }
}

export async function getUserFollowers(userId: string) {
    try {
        const currentUserId = await getDbUserId();

        const follows = await prisma.follows.findMany({
            where: {
                followingId: userId,
            },
            include: {
                follower: {
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

        return follows.map((f) => ({
            ...f.follower,
            isFollowing: currentUserId ? (f.follower.followers?.length ?? 0) > 0 : false,
        }));
    } catch (error) {
        console.error("Error fetching followers:", error);
        return [];
    }
}

export async function getUserFollowing(userId: string) {
    try {
        const currentUserId = await getDbUserId();

        const follows = await prisma.follows.findMany({
            where: {
                followerId: userId,
            },
            include: {
                following: {
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

        return follows.map((f) => ({
            ...f.following,
            isFollowing: currentUserId ? (currentUserId === userId || (f.following.followers?.length ?? 0) > 0) : false,
        }));
    } catch (error) {
        console.error("Error fetching following:", error);
        return [];
    }
}

export async function getUserStats(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                    },
                },
            },
        });

        return {
            followersCount: user?._count.followers ?? 0,
            followingCount: user?._count.following ?? 0,
        };
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return { followersCount: 0, followingCount: 0 };
    }
}