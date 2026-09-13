import { Suspense } from "react";
import HomePage from "@/components/HomePage";
import { FeedSkeleton } from "@/components/FeedSkeleton";

export default function Home() {
  return (
    <main>
      <Suspense fallback={<FeedSkeleton />}>
        <HomePage />
      </Suspense>
    </main>
  );
}
