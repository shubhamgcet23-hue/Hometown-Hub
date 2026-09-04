"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Users, MapPin, Settings } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Community, Post, EventItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import PostCard from "@/components/PostCard";
import EventCard from "@/components/EventCard";

type Tab = "feed" | "about" | "events" | "members";

export default function CommunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [membership, setMembership] = useState<{ role: string } | null>(null);
  const [tab, setTab] = useState<Tab>("feed");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/communities/${slug}`)
      .then((res) => {
        setCommunity(res.data.data.community);
        setMembership(res.data.data.membership);
      })
      .catch(() => setCommunity(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function join() {
    if (!user) return toast.error("Log in to join this community.");
    if (!community) return;
    setJoining(true);
    try {
      const res = await api.post(`/communities/${community.id}/join`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }

  async function leave() {
    if (!community) return;
    if (!confirm("Leave this community?")) return;
    try {
      await api.post(`/communities/${community.id}/leave`);
      toast.success("You've left the community.");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) return <div className="py-16 text-center text-evergreen-900/60">Loading community...</div>;
  if (!community) return <div className="py-16 text-center text-evergreen-900/60">Unable to load community.</div>;

  const isModerator = membership && (membership.role === "MODERATOR" || membership.role === "ADMIN");

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-evergreen-100 bg-white">
        <div className="flex h-32 items-end bg-evergreen-100 px-6 pb-4 sm:h-40">
          <h1 className="font-display text-2xl text-evergreen-900 sm:text-3xl">{community.name}</h1>
        </div>
        <div className="flex flex-col gap-3 p-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1 text-sm text-evergreen-900/70">
              <MapPin size={14} /> {community.city}, {community.state}, {community.country}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-evergreen-900/70">
              <Users size={14} /> {community._count?.members ?? 0} members
            </p>
          </div>
          <div className="flex gap-2">
            {isModerator && (
              <Link href={`/communities/${community.slug}/manage`} className="flex items-center gap-1.5 rounded-full border border-evergreen-300 px-4 py-2 text-sm text-evergreen-900 hover:bg-evergreen-50">
                <Settings size={15} /> Manage
              </Link>
            )}
            {membership ? (
              <button onClick={leave} className="rounded-full border border-evergreen-300 px-4 py-2 text-sm text-evergreen-900 hover:bg-evergreen-50">
                Joined
              </button>
            ) : (
              <button onClick={join} disabled={joining} className="rounded-full bg-evergreen-700 px-5 py-2 text-sm text-paper hover:bg-evergreen-600 disabled:opacity-60">
                {community.privacy === "PRIVATE" ? "Request to join" : "Join community"}
              </button>
            )}
          </div>
        </div>
        <p className="px-6 pb-5 text-sm text-evergreen-900/80">{community.description}</p>
      </div>

      <div className="mt-6 flex gap-1 border-b border-evergreen-100">
        {(["feed", "about", "events", "members"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-evergreen-700 text-evergreen-900" : "text-evergreen-900/60"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "feed" && <CommunityFeed communityId={community.id} canPost={!!membership} isModerator={!!isModerator} />}
        {tab === "about" && <CommunityAbout community={community} />}
        {tab === "events" && <CommunityEvents communityId={community.id} />}
        {tab === "members" && <CommunityMembers communityId={community.id} canView={!!membership || community.privacy === "PUBLIC"} />}
      </div>
    </div>
  );
}

function CommunityFeed({ communityId, canPost, isModerator }: { communityId: string; canPost: boolean; isModerator: boolean }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"GENERAL" | "ANNOUNCEMENT" | "DISCUSSION">("GENERAL");
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    api.get("/posts", { params: { communityId } }).then((res) => setPosts(res.data.data.posts));
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post("/posts", { communityId, content, type });
      setContent("");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      {canPost && (
        <form onSubmit={submit} className="rounded-card border border-evergreen-100 bg-white p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community..."
            rows={3}
            className="w-full resize-none rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500"
          />
          <div className="mt-3 flex items-center justify-between">
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-lg border border-evergreen-200 px-2 py-1.5 text-sm">
              <option value="GENERAL">General post</option>
              <option value="DISCUSSION">Discussion</option>
              {isModerator && <option value="ANNOUNCEMENT">Announcement</option>}
            </select>
            <button type="submit" disabled={posting} className="rounded-full bg-evergreen-700 px-5 py-1.5 text-sm text-paper hover:bg-evergreen-600 disabled:opacity-60">
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      )}

      {posts === null && <p className="text-sm text-evergreen-900/60">Loading feed...</p>}
      {posts?.map((post) => <PostCard key={post.id} post={post} canModerate={isModerator} onChanged={load} />)}
      {posts?.length === 0 && <p className="py-8 text-center text-sm text-evergreen-900/60">No posts yet. Be the first to share something.</p>}
    </div>
  );
}

function CommunityAbout({ community }: { community: Community }) {
  return (
    <div className="rounded-card border border-evergreen-100 bg-white p-6">
      <h3 className="font-display text-lg text-evergreen-900">About this community</h3>
      <p className="mt-2 text-sm text-evergreen-900/80">{community.description}</p>
      {community.rules && (
        <>
          <h4 className="mt-6 text-sm font-medium text-evergreen-900">Community rules</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-evergreen-900/80">{community.rules}</p>
        </>
      )}
    </div>
  );
}

function CommunityEvents({ communityId }: { communityId: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    api.get("/events", { params: { communityId } }).then((res) => setEvents(res.data.data.events));
  }, [communityId]);

  return (
    <div>
      {user && (
        <div className="mb-4 flex justify-end">
          <Link href={`/events/create?communityId=${communityId}`} className="rounded-full bg-evergreen-700 px-4 py-2 text-sm text-paper hover:bg-evergreen-600">
            Create event
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {events?.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
      {events?.length === 0 && <p className="py-8 text-center text-sm text-evergreen-900/60">No events scheduled yet.</p>}
    </div>
  );
}

function CommunityMembers({ communityId, canView }: { communityId: string; canView: boolean }) {
  const [members, setMembers] = useState<{ id: string; role: string; user: { id: string; fullName: string; username: string } }[] | null>(null);

  useEffect(() => {
    if (!canView) return;
    api.get(`/communities/${communityId}/members`).then((res) => setMembers(res.data.data.members)).catch(() => setMembers([]));
  }, [communityId, canView]);

  if (!canView) return <p className="text-sm text-evergreen-900/60">This community&apos;s member list is private.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {members?.map((m) => (
        <Link key={m.id} href={`/profile/${m.user.username}`} className="flex items-center justify-between rounded-card border border-evergreen-100 bg-white p-3">
          <span className="flex items-center gap-2 text-sm text-evergreen-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-evergreen-600 text-xs text-paper">{m.user.fullName.charAt(0)}</span>
            {m.user.fullName}
          </span>
          {m.role !== "MEMBER" && <span className="rounded-full bg-evergreen-50 px-2 py-0.5 text-xs text-evergreen-700">{m.role}</span>}
        </Link>
      ))}
      {members?.length === 0 && <p className="text-sm text-evergreen-900/60">No members yet.</p>}
    </div>
  );
}
