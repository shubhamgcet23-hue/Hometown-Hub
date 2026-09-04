"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import PostCard from "@/components/PostCard";
import { api } from "@/lib/api";
import { Post } from "@/types";

function FeedContent() {
  const [posts, setPosts] = useState<Post[] | null>(null);

  const load = useCallback(() => {
    api.get("/posts").then((res) => setPosts(res.data.data.posts));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-evergreen-900">Your feed</h1>
      <p className="mt-1 text-sm text-evergreen-900/70">Updates from the communities you&apos;ve joined.</p>

      <div className="mt-6 space-y-4">
        {posts === null && <p className="text-sm text-evergreen-900/60">Loading feed...</p>}
        {posts?.map((post) => <PostCard key={post.id} post={post} onChanged={load} />)}
        {posts?.length === 0 && (
          <div className="rounded-card border border-evergreen-100 bg-white p-8 text-center">
            <p className="text-sm text-evergreen-900/70">
              You haven&apos;t joined any communities yet. <Link href="/communities" className="font-medium text-evergreen-700 hover:underline">Find your hometown</Link> to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <ProtectedRoute>
      <FeedContent />
    </ProtectedRoute>
  );
}
