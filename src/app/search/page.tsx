import { searchAll } from "@/actions/search.action";
import { getDbUserId } from "@/actions/user.action";
import SearchPageClient from "./SearchPageClient";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    tab?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" - Search | Socially` : "Search | Socially",
    description: "Search for people and posts on Socially",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, tab } = await searchParams;
  const dbUserId = await getDbUserId();

  const results = q?.trim() ? await searchAll(q.trim()) : { users: [], posts: [] };

  return (
    <SearchPageClient
      query={q || ""}
      initialUsers={results.users}
      initialPosts={results.posts}
      dbUserId={dbUserId}
      initialTab={tab}
    />
  );
}
