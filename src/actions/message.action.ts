'use server';

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { sendMessageSchema } from "@/lib/validations";

export interface ConversationParticipant {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
}

export interface FormattedConversation {
  id: string;
  otherUser: ConversationParticipant;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface MessageWithSender {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender: ConversationParticipant;
}

/**
 * Fetch all conversations for the authenticated user, ordered by most recently active.
 */
export async function getConversations(): Promise<FormattedConversation[]> {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      include: {
        userOne: {
          select: { id: true, name: true, username: true, image: true },
        },
        userTwo: {
          select: { id: true, name: true, username: true, image: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((c) => {
      const otherUser = c.userOneId === userId ? c.userTwo : c.userOne;
      const lastMessage = c.messages[0] || null;
      const unreadCount = c._count.messages;

      return {
        id: c.id,
        otherUser,
        lastMessage,
        unreadCount,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

/**
 * Finds or creates a canonical 1-on-1 conversation with the given user.
 */
export async function getOrCreateConversation(otherUserId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (userId === otherUserId) {
      return { success: false, error: "Cannot message yourself" };
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, username: true, image: true },
    });

    if (!otherUser) {
      return { success: false, error: "User not found" };
    }

    const [userOneId, userTwoId] = [userId, otherUserId].sort();

    let conversation = await prisma.conversation.findUnique({
      where: {
        userOneId_userTwoId: { userOneId, userTwoId },
      },
      include: {
        userOne: { select: { id: true, name: true, username: true, image: true } },
        userTwo: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userOneId, userTwoId },
        include: {
          userOne: { select: { id: true, name: true, username: true, image: true } },
          userTwo: { select: { id: true, name: true, username: true, image: true } },
        },
      });
    }

    const formattedOtherUser =
      conversation.userOneId === userId ? conversation.userTwo : conversation.userOne;

    return {
      success: true,
      conversation: {
        id: conversation.id,
        otherUser: formattedOtherUser,
        updatedAt: conversation.updatedAt,
        createdAt: conversation.createdAt,
      },
    };
  } catch (error) {
    console.error("Error creating/getting conversation:", error);
    return { success: false, error: "Failed to open conversation" };
  }
}

/**
 * Fetch messages for a specific conversation.
 */
export async function getMessages(conversationId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized", messages: [] };

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userOneId: true, userTwoId: true },
    });

    if (
      !conversation ||
      (conversation.userOneId !== userId && conversation.userTwoId !== userId)
    ) {
      return { success: false, error: "Conversation not found", messages: [] };
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 150,
    });

    return { success: true, messages: messages as MessageWithSender[] };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages", messages: [] };
  }
}

/**
 * Send a message in an existing conversation.
 */
export async function sendMessage(conversationId: string, content: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validation = sendMessageSchema.safeParse({ conversationId, content });
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Invalid message",
      };
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userOneId: true, userTwoId: true },
    });

    if (
      !conversation ||
      (conversation.userOneId !== userId && conversation.userTwoId !== userId)
    ) {
      return { success: false, error: "Conversation not found" };
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: validation.data.content,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { success: true, message: message as MessageWithSender };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

/**
 * Mark all unread incoming messages in a conversation as read.
 */
export async function markMessagesAsRead(conversationId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false };

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    return { success: false };
  }
}

/**
 * Get total unread direct message count for the current user.
 */
export async function getUnreadMessagesCount(): Promise<number> {
  try {
    const userId = await getDbUserId();
    if (!userId) return 0;

    const count = await prisma.message.count({
      where: {
        conversation: {
          OR: [{ userOneId: userId }, { userTwoId: userId }],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    return 0;
  }
}

/**
 * Search users to start a new chat with.
 */
export async function searchUsersToMessage(query: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const trimmed = query.trim();
    if (!trimmed) return [];

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { username: { contains: trimmed, mode: "insensitive" } },
          { name: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
      take: 8,
    });

    return users as ConversationParticipant[];
  } catch (error) {
    console.error("Error searching users to message:", error);
    return [];
  }
}
