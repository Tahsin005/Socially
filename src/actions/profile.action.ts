'use server';

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

export async function getProfileByUsername(username: string) {
    try {
        const user = await prisma.user.findUnique({
        where: { username: username },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                image: true,
                location: true,
                website: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true,
                    },
                },
            },
        });

        return user;
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw new Error("Failed to fetch profile");
    }
}

const postInclude = {
    author: {
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
        },
    },
    comments: {
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
        orderBy: {
            createdAt: "asc" as const,
        },
    },
    likes: {
        select: {
            userId: true,
            type: true,
        },
    },
    bookmarks: {
        select: {
            userId: true,
        },
    },
    _count: {
        select: {
            likes: true,
            comments: true,
            bookmarks: true,
        },
    },
};

export async function getUserPosts(userId: string) {
    try {
        const posts = await prisma.post.findMany({
            where: {
                authorId: userId,
            },
            include: postInclude,
            orderBy: {
                createdAt: "desc",
            },
        });

        return posts;
    } catch (error) {
        console.error("Error fetching user posts:", error);
        throw new Error("Failed to fetch user posts");
    }
}

export async function getUserLikedPosts(userId: string) {
    try {
        const likedPosts = await prisma.post.findMany({
            where: {
                likes: {
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

        return likedPosts;
    } catch (error) {
        console.error("Error fetching liked posts:", error);
        throw new Error("Failed to fetch liked posts");
    }
}

import { updateProfileSchema } from "@/lib/validations";

export async function updateProfile(formData: FormData) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const rawData = {
            name: formData.get("name") as string,
            bio: (formData.get("bio") as string) || "",
            location: (formData.get("location") as string) || "",
            website: (formData.get("website") as string) || "",
        };

        const validation = updateProfileSchema.safeParse(rawData);
        if (!validation.success) {
            return { success: false, error: validation.error.issues[0]?.message || "Invalid profile data" };
        }

        const user = await prisma.user.update({
            where: { clerkId },
            data: validation.data,
        });

        revalidatePath("/");
        revalidatePath("/profile");
        revalidatePath(`/profile/${user.username}`);
        return { success: true, user };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

export async function isFollowing(userId: string) {
    try {
        const currentUserId = await getDbUserId();
        if (!currentUserId) return false;

        const follow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId,
                },
            },
        });

        return !!follow;
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}
