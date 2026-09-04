"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Community } from "@/types";
import CommunityCard from "@/components/CommunityCard";
import { useAuth } from "@/context/AuthContext";

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get("/communities", { params: q ? { q } : {} })
        .then((res) => setCommunities(res.data.data.communities))
        .finally(() => setLoading(false));
    }, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [q]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-evergreen-900">Discover communities</h1>
          <p className="text-sm text-evergreen-900/70">Find the hometown you grew up in, or the one you&apos;ve adopted.</p>
        </div>
        {user && (
          <Link href="/communities/create" className="flex items-center gap-1.5 self-start rounded-full bg-evergreen-700 px-4 py-2 text-sm text-paper hover:bg-evergreen-600">
            <Plus size={16} /> Create community
          </Link>
        )}
      </div>

      <div className="relative mt-6 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-evergreen-900/50" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by city, village, or community name"
          className="w-full rounded-full border border-evergreen-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-evergreen-500"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-card bg-evergreen-50" />
          ))}
        {!loading && communities.map((c) => <CommunityCard key={c.id} community={c} />)}
      </div>

      {!loading && communities.length === 0 && (
        <div className="mt-16 text-center text-evergreen-900/60">
          <p>No communities found. Be the first to start one for your hometown.</p>
        </div>
      )}
    </div>
  );
}
