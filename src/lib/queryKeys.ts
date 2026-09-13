/**
 * Centralized, type-safe query key factory for TanStack Query across the application.
 */

export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    forYou: () => [...queryKeys.posts.all, 'for-you'] as const,
    following: () => [...queryKeys.posts.all, 'following'] as const,
    user: (userId: string) => [...queryKeys.posts.all, 'user', userId] as const,
    detail: (postId: string) => [...queryKeys.posts.all, 'detail', postId] as const,
    bookmarks: (userId: string) => [...queryKeys.posts.all, 'bookmarks', userId] as const,
  },
  users: {
    all: ['users'] as const,
    whoToFollow: () => [...queryKeys.users.all, 'who-to-follow'] as const,
    stats: (userId: string) => [...queryKeys.users.all, 'stats', userId] as const,
    profile: (username: string) => [...queryKeys.users.all, 'profile', username] as const,
    followers: (userId: string) => [...queryKeys.users.all, 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.users.all, 'following', userId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  messages: {
    all: ['messages'] as const,
    conversations: () => [...queryKeys.messages.all, 'conversations'] as const,
    thread: (conversationId: string) => [...queryKeys.messages.all, 'thread', conversationId] as const,
    unreadCount: () => [...queryKeys.messages.all, 'unread-count'] as const,
  },
};
