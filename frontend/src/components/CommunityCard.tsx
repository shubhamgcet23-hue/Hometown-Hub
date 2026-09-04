import Link from "next/link";
import { Users, MapPin } from "lucide-react";
import { Community } from "@/types";

export default function CommunityCard({ community }: { community: Community }) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className="block overflow-hidden rounded-card border border-evergreen-100 bg-white transition-shadow hover:shadow-md"
    >
      <div className="flex h-24 items-end bg-evergreen-100 px-4 pb-3">
        <span className="font-display text-lg text-evergreen-900">{community.name}</span>
      </div>
      <div className="space-y-2 p-4">
        <p className="flex items-center gap-1 text-sm text-evergreen-900/70">
          <MapPin size={14} /> {community.city}, {community.state}
        </p>
        <p className="line-clamp-3 text-sm text-evergreen-900/80">{community.description}</p>
        <div className="flex items-center justify-between pt-2 text-xs text-evergreen-900/60">
          <span className="flex items-center gap-1">
            <Users size={13} /> {community._count?.members ?? 0} members
          </span>
          <span className="rounded-full bg-evergreen-50 px-2 py-0.5 text-evergreen-700">
            {community.privacy === "PRIVATE" ? "Private" : "Public"}
          </span>
        </div>
      </div>
    </Link>
  );
}
