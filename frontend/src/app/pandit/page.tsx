"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";

interface PanditProfile {
  id: string;
  name: string;
  location: string;
  description?: string;
  servicesOffered: string[];
  verificationStatus: string;
}

export default function PanditListPage() {
  const [profiles, setProfiles] = useState<PanditProfile[] | null>(null);

  useEffect(() => {
    api.get("/pandit").then((res) => setProfiles(res.data.data.profiles));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-evergreen-900">Local services directory</h1>
          <p className="mt-1 text-sm text-evergreen-900/70">Verified community contributors and service providers — starting with Pandit onboarding.</p>
        </div>
        <Link href="/pandit/onboard" className="flex items-center gap-1.5 rounded-full bg-evergreen-700 px-4 py-2 text-sm text-paper hover:bg-evergreen-600">
          <Plus size={16} /> Add your profile
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {profiles === null && <p className="text-sm text-evergreen-900/60">Loading...</p>}
        {profiles?.map((p) => (
          <Link key={p.id} href={`/pandit/${p.id}`} className="rounded-card border border-evergreen-100 bg-white p-4 hover:shadow-md">
            <p className="font-medium text-evergreen-900">{p.name}</p>
            <p className="text-xs text-evergreen-900/60">{p.location}</p>
            {p.servicesOffered.length > 0 && (
              <p className="mt-2 text-xs text-evergreen-900/70">{p.servicesOffered.join(", ")}</p>
            )}
          </Link>
        ))}
        {profiles?.length === 0 && <p className="text-sm text-evergreen-900/60">No verified profiles yet.</p>}
      </div>
    </div>
  );
}
