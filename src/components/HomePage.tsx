import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import FeedTabs from "@/components/FeedTabs";
import WhoToFollow from "@/components/WhoToFollow";
import { currentUser } from "@clerk/nextjs/server";

export default async function HomePage() {
  const user = await currentUser();
  const { posts, nextCursor } = await getPosts({ limit: 10 });
  const dbUserId = await getDbUserId();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}

        <FeedTabs
          initialPosts={posts}
          initialNextCursor={nextCursor}
          dbUserId={dbUserId}
          isAuthenticated={!!user}
        />
      </div>

      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <WhoToFollow />
      </div>
    </div>
  );
}
