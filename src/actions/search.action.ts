'use server';

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { PostWithDetails } from "./post.action";

export interface SearchUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

const postInclude = {
  author: {
    select: {
      id: true,
      name: true,
      image: true,
      username: true,
    },
  },
  comments: {
    include: {
      author: {
        select: {
          id: true,
          username: true,
          image: true,
          name: true,
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

export async function searchGlobal(query: string, limit = 5) {
  try {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { users: [], posts: [] };
    }

    const currentUserId = await getDbUserId();

    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: trimmedQuery, mode: "insensitive" } },
            { username: { contains: trimmedQuery, mode: "insensitive" } },
            { bio: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
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
        },
        take: limit,
      }),

      prisma.post.findMany({
        where: {
          content: { contains: trimmedQuery, mode: "insensitive" },
        },
        include: postInclude,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      }),
    ]);

    const formattedUsers: SearchUser[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      _count: user._count,
      isFollowing: currentUserId ? (user.followers?.length ?? 0) > 0 : false,
    }));

    return {
      users: formattedUsers,
      posts: posts as PostWithDetails[],
    };
  } catch (error) {
    console.error("Error searching global:", error);
    return { users: [], posts: [] };
  }
}

export async function searchAll(query: string) {
  return searchGlobal(query, 20);
}
