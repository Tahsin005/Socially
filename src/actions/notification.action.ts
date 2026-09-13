"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";

export async function getNotifications() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                post: {
                    select: {
                        id: true,
                        content: true,
                        image: true,
                    },
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return notifications;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to fetch notifications");
    }
}

import { revalidatePath } from "next/cache";

export async function getUnreadNotificationCount() {
    try {
        const userId = await getDbUserId();
        if (!userId) return 0;

        const count = await prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });

        return count;
    } catch (error) {
        console.error("Error fetching unread notification count:", error);
        return 0;
    }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        await prisma.notification.updateMany({
            where: {
                userId,
                id: {
                    in: notificationIds,
                },
            },
            data: {
                read: true,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        await prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: {
                read: true,
            },
        });

        revalidatePath("/", "layout");
        revalidatePath("/notifications");
        return { success: true };
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false, error: "Failed to mark all as read" };
    }
}
