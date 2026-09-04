"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, apiErrorMessage } from "@/lib/api";
import { Community } from "@/types";

interface JoinRequest {
  id: string;
  user: { id: string; fullName: string; username: string };
}
interface Report {
  id: string;
  reason: string;
  status: string;
  description?: string;
  reporter: { fullName: string };
  post?: { id: string; content: string } | null;
}

function ManageContent() {
  const { slug } = useParams<{ slug: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const communityRes = await api.get(`/communities/${slug}`);
      const c: Community = communityRes.data.data.community;
      setCommunity(c);

      const [requestsRes, reportsRes] = await Promise.all([
        api.get(`/communities/${c.id}/join-requests`).catch(() => ({ data: { data: { requests: [] } } })),
        api.get(`/reports`, { params: { communityId: c.id, status: "PENDING" } }).catch(() => ({ data: { data: { reports: [] } } })),
      ]);
      setRequests(requestsRes.data.data.requests);
      setReports(reportsRes.data.data.reports);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(userId: string) {
    if (!community) return;
    await api.post(`/communities/${community.id}/members/${userId}/approve`).catch((err) => toast.error(apiErrorMessage(err)));
    load();
  }
  async function reject(userId: string) {
    if (!community) return;
    await api.post(`/communities/${community.id}/members/${userId}/reject`).catch((err) => toast.error(apiErrorMessage(err)));
    load();
  }
  async function resolveReport(id: string, status: "RESOLVED" | "DISMISSED") {
    await api.put(`/reports/${id}`, { status }).catch((err) => toast.error(apiErrorMessage(err)));
    load();
  }

  if (loading || !community) return <div className="py-16 text-center text-evergreen-900/60">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-evergreen-900">Manage {community.name}</h1>
        <p className="text-sm text-evergreen-900/70">Review membership requests and community reports.</p>
      </div>

      <section>
        <h2 className="font-display text-lg text-evergreen-900">Pending member requests</h2>
        <div className="mt-3 space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-card border border-evergreen-100 bg-white p-3">
              <span className="text-sm text-evergreen-900">{r.user.fullName} (@{r.user.username})</span>
              <div className="flex gap-2">
                <button onClick={() => approve(r.user.id)} className="rounded-full bg-evergreen-700 px-3 py-1 text-xs text-paper hover:bg-evergreen-600">Approve</button>
                <button onClick={() => reject(r.user.id)} className="rounded-full border border-evergreen-300 px-3 py-1 text-xs text-evergreen-900 hover:bg-evergreen-50">Reject</button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p className="text-sm text-evergreen-900/60">No pending requests.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-evergreen-900">Community reports</h2>
        <div className="mt-3 space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-card border border-evergreen-100 bg-white p-3">
              <p className="text-sm text-evergreen-900">
                <span className="font-medium">{r.reason.replace("_", " ")}</span> reported by {r.reporter.fullName}
              </p>
              {r.post && <p className="mt-1 line-clamp-2 text-xs text-evergreen-900/60">&ldquo;{r.post.content}&rdquo;</p>}
              {r.description && <p className="mt-1 text-xs text-evergreen-900/60">{r.description}</p>}
              <div className="mt-2 flex gap-2">
                <button onClick={() => resolveReport(r.id, "RESOLVED")} className="rounded-full bg-evergreen-700 px-3 py-1 text-xs text-paper hover:bg-evergreen-600">Resolve</button>
                <button onClick={() => resolveReport(r.id, "DISMISSED")} className="rounded-full border border-evergreen-300 px-3 py-1 text-xs text-evergreen-900 hover:bg-evergreen-50">Dismiss</button>
              </div>
            </div>
          ))}
          {reports.length === 0 && <p className="text-sm text-evergreen-900/60">No pending reports.</p>}
        </div>
      </section>
    </div>
  );
}

export default function ManageCommunityPage() {
  return (
    <ProtectedRoute>
      <ManageContent />
    </ProtectedRoute>
  );
}
