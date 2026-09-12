import { Suspense } from "react";
import { NotificationsSkeleton } from "@/components/NotificationSkeleton";
import NotificationList from "./NotificationList";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationList />
      </Suspense>
    </div>
  );
}
