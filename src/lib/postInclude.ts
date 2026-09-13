import { Prisma } from "@prisma/client";

export const postInclude = {
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
      type: true,
    },
  },
  bookmarks: {
    select: {
      userId: true,
    },
  },
  poll: {
    include: {
      options: {
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc" as const,
        },
      },
      votes: {
        select: {
          userId: true,
          pollOptionId: true,
        },
      },
    },
  },
  _count: {
    select: {
      likes: true,
      comments: true,
      bookmarks: true,
    },
  },
} satisfies Prisma.PostInclude;

export type PostWithDetailsType = Prisma.PostGetPayload<{
  include: typeof postInclude;
}>;
