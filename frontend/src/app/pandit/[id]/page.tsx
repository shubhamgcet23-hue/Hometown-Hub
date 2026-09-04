"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface PanditProfile {
  id: string;
  name: string;
  location: string;
  description?: string;
  experienceYears?: number;
  servicesOffered: string[];
  contactPhone?: string;
  contactEmail?: string;
  availability?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  user: { fullName: string; username: string };
}

export default function PanditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PanditProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api
      .get(`/pandit/${id}`)
      .then((res) => setProfile(res.data.data.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function verify(status: "VERIFIED" | "REJECTED") {
    try {
      await api.put(`/pandit/${id}/verify`, { status });
      toast.success(`Profile ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) return <div className="py-16 text-center text-evergreen-900/60">Loading profile...</div>;
  if (!profile) return <div className="py-16 text-center text-evergreen-900/60">Profile not found.</div>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-card border border-evergreen-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-evergreen-900">{profile.name}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs ${profile.verificationStatus === "VERIFIED" ? "bg-evergreen-50 text-evergreen-700" : profile.verificationStatus === "REJECTED" ? "bg-clay/10 text-clay" : "bg-lantern-400/20 text-lantern-600"}`}>
            {profile.verificationStatus}
          </span>
        </div>
        <p className="mt-1 text-sm text-evergreen-900/60">{profile.location}</p>
        {profile.description && <p className="mt-4 text-sm text-evergreen-900/80">{profile.description}</p>}

        <dl className="mt-4 space-y-1 text-sm text-evergreen-900/80">
          {profile.experienceYears !== undefined && <div><dt className="inline font-medium">Experience: </dt><dd className="inline">{profile.experienceYears} years</dd></div>}
          {profile.availability && <div><dt className="inline font-medium">Availability: </dt><dd className="inline">{profile.availability}</dd></div>}
          {profile.contactPhone && <div><dt className="inline font-medium">Phone: </dt><dd className="inline">{profile.contactPhone}</dd></div>}
          {profile.contactEmail && <div><dt className="inline font-medium">Email: </dt><dd className="inline">{profile.contactEmail}</dd></div>}
        </dl>

        {profile.servicesOffered.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.servicesOffered.map((s) => (
              <span key={s} className="rounded-full bg-evergreen-50 px-2 py-0.5 text-xs text-evergreen-700">{s}</span>
            ))}
          </div>
        )}

        {user?.platformRole === "PLATFORM_ADMIN" && profile.verificationStatus === "PENDING" && (
          <div className="mt-6 flex gap-2 border-t border-evergreen-100 pt-4">
            <button onClick={() => verify("VERIFIED")} className="rounded-full bg-evergreen-700 px-4 py-1.5 text-sm text-paper hover:bg-evergreen-600">Verify</button>
            <button onClick={() => verify("REJECTED")} className="rounded-full border border-clay px-4 py-1.5 text-sm text-clay hover:bg-clay/10">Reject</button>
          </div>
        )}
      </div>
    </div>
  );
}
