"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, apiErrorMessage } from "@/lib/api";
import { Community } from "@/types";

const STATUS_FILTERS = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"] as const;

function AdminCommunitiesContent() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("PENDING");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/admin/communities", { params: { status } })
      .then((res) => setCommunities(res.data.data.communities))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, newStatus: "ACTIVE" | "REJECTED" | "SUSPENDED") {
    try {
      await api.put(`/admin/communities/${id}/status`, { status: newStatus });
      toast.success("Community status updated.");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-evergreen-900">Community management</h1>

      <div className="mt-4 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs capitalize ${status === s ? "bg-evergreen-700 text-paper" : "bg-evergreen-50 text-evergreen-900"}`}
          >
            {s.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-evergreen-900/60">Loading communities...</p>}
        {!loading &&
          communities.map((c) => (
            <div key={c.id} className="flex flex-col justify-between gap-3 rounded-card border border-evergreen-100 bg-white p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium text-evergreen-900">{c.name}</p>
                <p className="text-xs text-evergreen-900/60">{c.city}, {c.state} · {c._count?.members ?? 0} members</p>
                <p className="mt-1 line-clamp-1 text-xs text-evergreen-900/60">{c.description}</p>
              </div>
              <div className="flex gap-2">
                {c.status === "PENDING" && (
                  <>
                    <button onClick={() => updateStatus(c.id, "ACTIVE")} className="rounded-full bg-evergreen-700 px-3 py-1.5 text-xs text-paper hover:bg-evergreen-600">Approve</button>
                    <button onClick={() => updateStatus(c.id, "REJECTED")} className="rounded-full border border-evergreen-300 px-3 py-1.5 text-xs text-evergreen-900 hover:bg-evergreen-50">Reject</button>
                  </>
                )}
                {c.status === "ACTIVE" && (
                  <button onClick={() => updateStatus(c.id, "SUSPENDED")} className="rounded-full border border-clay px-3 py-1.5 text-xs text-clay hover:bg-clay/10">Suspend</button>
                )}
                {c.status === "SUSPENDED" && (
                  <button onClick={() => updateStatus(c.id, "ACTIVE")} className="rounded-full bg-evergreen-700 px-3 py-1.5 text-xs text-paper hover:bg-evergreen-600">Reactivate</button>
                )}
              </div>
            </div>
          ))}
        {!loading && communities.length === 0 && <p className="text-sm text-evergreen-900/60">No communities in this status.</p>}
      </div>
    </div>
  );
}

export default function AdminCommunitiesPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminCommunitiesContent />
    </ProtectedRoute>
  );
}
