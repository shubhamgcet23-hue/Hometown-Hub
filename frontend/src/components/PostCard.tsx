"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, Flag, Pin, MoreHorizontal, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { Post } from "@/types";
import { useAuth } from "@/context/AuthContext";

const TYPE_LABEL: Record<string, string> = {
  GENERAL: "",
  ANNOUNCEMENT: "Announcement",
  DISCUSSION: "Discussion",
  EVENT: "Event",
  POLL: "Poll",
};

export default function PostCard({
  post,
  canModerate = false,
  onChanged,
}: {
  post: Post;
  canModerate?: boolean;
  onChanged?: () => void;
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(!!post.likedByMe);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  async function toggleLike() {
    if (!user) return toast.error("Log in to like posts.");
    try {
      if (liked) {
        await api.delete(`/posts/${post.id}/like`);
        setLikeCount((c) => c - 1);
      } else {
        await api.post(`/posts/${post.id}/like`);
        setLikeCount((c) => c + 1);
      }
      setLiked((v) => !v);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function share() {
    try {
      await api.post(`/posts/${post.id}/share`);
      toast.success("Shared to your activity.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function report() {
    try {
      await api.post(`/posts/${post.id}/report`, { reason: "OTHER", description: "Reported from feed" });
      toast.success("Thanks — this post has been reported for review.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setMenuOpen(false);
    }
  }

  async function togglePin() {
    try {
      await api.post(`/posts/${post.id}/pin`);
      onChanged?.();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setMenuOpen(false);
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success("Post deleted.");
      onChanged?.();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setMenuOpen(false);
    }
  }

  const isOwner = user?.id === post.authorId;

  return (
    <article className="rounded-card border border-evergreen-100 bg-white p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-evergreen-600 text-sm text-paper">
            {post.author.fullName.charAt(0)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/profile/${post.author.username}`} className="text-sm font-medium text-evergreen-900 hover:underline">
                {post.author.fullName}
              </Link>
              {post.isPinned && <Pin size={13} className="text-lantern-500" />}
            </div>
            <p className="text-xs text-evergreen-900/60">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              {TYPE_LABEL[post.type] ? ` · ${TYPE_LABEL[post.type]}` : ""}
              {" · "}
              <Link href={`/communities/${post.community.slug}`} className="hover:underline">{post.community.name}</Link>
            </p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="rounded-full p-1 text-evergreen-900/60 hover:bg-evergreen-100" aria-label="More options">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-evergreen-100 bg-white py-1 text-sm shadow-md">
              <button onClick={report} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-evergreen-50">
                <Flag size={14} /> Report
              </button>
              {canModerate && (
                <button onClick={togglePin} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-evergreen-50">
                  <Pin size={14} /> {post.isPinned ? "Unpin" : "Pin"}
                </button>
              )}
              {(isOwner || canModerate) && (
                <button onClick={deletePost} className="flex w-full items-center gap-2 px-3 py-2 text-left text-clay hover:bg-evergreen-50">
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <p className="mt-3 whitespace-pre-wrap text-sm text-evergreen-900">{post.content}</p>

      {post.images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt="Post attachment" className="h-40 w-full rounded-lg object-cover" />
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center gap-5 border-t border-evergreen-100 pt-3 text-sm text-evergreen-900/70">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 ${liked ? "text-clay" : ""}`}>
          <Heart size={16} fill={liked ? "currentColor" : "none"} /> {likeCount}
        </button>
        <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1.5">
          <MessageCircle size={16} /> {post._count.comments}
        </button>
        <button onClick={share} className="flex items-center gap-1.5">
          <Share2 size={16} /> {post._count.shares}
        </button>
      </footer>

      {showComments && <PostComments postId={post.id} />}
    </article>
  );
}

function PostComments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<
    { id: string; content: string; author: { fullName: string; username: string }; createdAt: string }[] | null
  >(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/posts/${postId}/comments`)
      .then((res) => setComments(res.data.data.comments))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Log in to comment.");
    if (!text.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text });
      setComments((c) => [...(c || []), res.data.data.comment]);
      setText("");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-evergreen-100 pt-3">
      {loading && <p className="text-xs text-evergreen-900/50">Loading comments...</p>}
      {comments?.map((c) => (
        <div key={c.id} className="rounded-lg bg-paper px-3 py-2 text-sm">
          <span className="font-medium text-evergreen-900">{c.author.fullName}</span>{" "}
          <span className="text-evergreen-900/80">{c.content}</span>
        </div>
      ))}
      {comments?.length === 0 && <p className="text-xs text-evergreen-900/50">No comments yet — be the first to reply.</p>}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-full border border-evergreen-200 px-3 py-1.5 text-sm outline-none focus:border-evergreen-500"
        />
        <button type="submit" className="rounded-full bg-evergreen-700 px-4 py-1.5 text-sm text-paper hover:bg-evergreen-600">
          Post
        </button>
      </form>
    </div>
  );
}
