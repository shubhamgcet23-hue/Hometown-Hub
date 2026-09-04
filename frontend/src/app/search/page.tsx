"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { api } from "@/lib/api";
import { Community } from "@/types";

interface SearchResults {
  communities: Community[];
  users: { id: string; fullName: string; username: string; city?: string | null }[];
  posts: { id: string; content: string; author: { fullName: string }; community: { name: string; slug: string } }[];
  events: { id: string; title: string; community: { name: string; slug: string } }[];
}

const FILTERS = [
  { key: "", label: "All" },
  { key: "communities", label: "Communities" },
  { key: "users", label: "People" },
  { key: "posts", label: "Posts" },
  { key: "events", label: "Events" },
] as const;

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get("/search", { params: { q, ...(type ? { type } : {}) } })
        .then((res) => setResults(res.data.data))
        .finally(() => setLoading(false));
    }, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [q, type]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-evergreen-900">Search Hometown Hub</h1>

      <div className="relative mt-6">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-evergreen-900/50" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search communities, people, posts, or events"
          className="w-full rounded-full border border-evergreen-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-evergreen-500"
          autoFocus
        />
      </div>

      <div className="mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setType(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs ${type === f.key ? "bg-evergreen-700 text-paper" : "bg-evergreen-50 text-evergreen-900"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {loading && <p className="text-sm text-evergreen-900/60">Searching...</p>}

        {results?.communities && results.communities.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-evergreen-900/70">Communities</h2>
            <div className="mt-2 space-y-2">
              {results.communities.map((c) => (
                <Link key={c.id} href={`/communities/${c.slug}`} className="block rounded-card border border-evergreen-100 bg-white p-3 text-sm hover:bg-evergreen-50">
                  <span className="font-medium text-evergreen-900">{c.name}</span> — {c.city}, {c.state}
                </Link>
              ))}
            </div>
          </div>
        )}

        {results?.users && results.users.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-evergreen-900/70">People</h2>
            <div className="mt-2 space-y-2">
              {results.users.map((u) => (
                <Link key={u.id} href={`/profile/${u.username}`} className="block rounded-card border border-evergreen-100 bg-white p-3 text-sm hover:bg-evergreen-50">
                  <span className="font-medium text-evergreen-900">{u.fullName}</span> @{u.username}
                </Link>
              ))}
            </div>
          </div>
        )}

        {results?.posts && results.posts.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-evergreen-900/70">Posts</h2>
            <div className="mt-2 space-y-2">
              {results.posts.map((p) => (
                <Link key={p.id} href={`/communities/${p.community.slug}`} className="block rounded-card border border-evergreen-100 bg-white p-3 text-sm hover:bg-evergreen-50">
                  <p className="line-clamp-2 text-evergreen-900">{p.content}</p>
                  <p className="mt-1 text-xs text-evergreen-900/50">{p.author.fullName} in {p.community.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {results?.events && results.events.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-evergreen-900/70">Events</h2>
            <div className="mt-2 space-y-2">
              {results.events.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="block rounded-card border border-evergreen-100 bg-white p-3 text-sm hover:bg-evergreen-50">
                  <span className="font-medium text-evergreen-900">{e.title}</span> — {e.community.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {q &&
          results &&
          !loading &&
          results.communities.length === 0 &&
          results.users.length === 0 &&
          results.posts.length === 0 &&
          results.events.length === 0 && <p className="text-sm text-evergreen-900/60">No results for &ldquo;{q}&rdquo;.</p>}
      </div>
    </div>
  );
}
