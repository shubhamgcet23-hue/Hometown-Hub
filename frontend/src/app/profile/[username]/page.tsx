"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { User, Community } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface ProfileData extends User {
  communities: { community: Community }[];
  _count: { posts: number; createdEvents: number; eventAttendance: number };
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/users/${username}`)
      .then((res) => setProfile(res.data.data.user))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="py-16 text-center text-evergreen-900/60">Loading profile...</div>;
  if (!profile) return <div className="py-16 text-center text-evergreen-900/60">User not found.</div>;

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-card border border-evergreen-100 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-evergreen-600 text-2xl text-paper">
              {profile.fullName.charAt(0)}
            </span>
            <div>
              <h1 className="font-display text-2xl text-evergreen-900">{profile.fullName}</h1>
              <p className="text-sm text-evergreen-900/60">@{profile.username}</p>
            </div>
          </div>
          {isOwnProfile && (
            <Link href="/settings" className="rounded-full border border-evergreen-300 px-4 py-2 text-sm text-evergreen-900 hover:bg-evergreen-50">
              Edit profile
            </Link>
          )}
        </div>

        {profile.bio && <p className="mt-4 text-sm text-evergreen-900/80">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-evergreen-900/70">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {profile.hometown ? `${profile.hometown}, ` : ""}{profile.city}, {profile.state}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={14} /> Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-evergreen-100 pt-4 text-center">
          <div>
            <p className="font-display text-xl text-evergreen-900">{profile._count.posts}</p>
            <p className="text-xs text-evergreen-900/60">Posts</p>
          </div>
          <div>
            <p className="font-display text-xl text-evergreen-900">{profile._count.createdEvents}</p>
            <p className="text-xs text-evergreen-900/60">Events created</p>
          </div>
          <div>
            <p className="font-display text-xl text-evergreen-900">{profile._count.eventAttendance}</p>
            <p className="text-xs text-evergreen-900/60">Events joined</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-lg text-evergreen-900">Communities</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {profile.communities.map(({ community }) => (
            <Link key={community.id} href={`/communities/${community.slug}`} className="rounded-card border border-evergreen-100 bg-white p-3 text-sm text-evergreen-900 hover:bg-evergreen-50">
              {community.name}
            </Link>
          ))}
          {profile.communities.length === 0 && <p className="text-sm text-evergreen-900/60">Not part of any communities yet.</p>}
        </div>
      </div>
    </div>
  );
}
