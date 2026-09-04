"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, apiErrorMessage } from "@/lib/api";

interface Report {
  id: string;
  reason: string;
  status: string;
  description?: string;
  reporter: { fullName: string };
  community?: { name: string } | null;
  post?: { content: string } | null;
  comment?: { content: string } | null;
}

const STATUS_FILTERS = ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"] as const;

function AdminReportsContent() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("PENDING");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/reports", { params: { status } })
      .then((res) => setReports(res.data.data.reports))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(id: string, newStatus: "UNDER_REVIEW" | "RESOLVED" | "DISMISSED") {
    try {
      await api.put(`/reports/${id}`, { status: newStatus });
      toast.success("Report updated.");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-evergreen-900">Platform reports</h1>

      <div className="mt-4 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs capitalize ${status === s ? "bg-evergreen-700 text-paper" : "bg-evergreen-50 text-evergreen-900"}`}
          >
            {s.toLowerCase().replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-evergreen-900/60">Loading reports...</p>}
        {!loading &&
          reports.map((r) => (
            <div key={r.id} className="rounded-card border border-evergreen-100 bg-white p-4">
              <p className="text-sm text-evergreen-900">
                <span className="font-medium">{r.reason.replace("_", " ")}</span> reported by {r.reporter.fullName}
                {r.community ? ` in ${r.community.name}` : ""}
              </p>
              {(r.post?.content || r.comment?.content) && (
                <p className="mt-1 line-clamp-2 text-xs text-evergreen-900/60">&ldquo;{r.post?.content || r.comment?.content}&rdquo;</p>
              )}
              {r.description && <p className="mt-1 text-xs text-evergreen-900/60">{r.description}</p>}
              {status !== "RESOLVED" && status !== "DISMISSED" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => resolve(r.id, "UNDER_REVIEW")} className="rounded-full border border-evergreen-300 px-3 py-1 text-xs text-evergreen-900 hover:bg-evergreen-50">Mark under review</button>
                  <button onClick={() => resolve(r.id, "RESOLVED")} className="rounded-full bg-evergreen-700 px-3 py-1 text-xs text-paper hover:bg-evergreen-600">Resolve</button>
                  <button onClick={() => resolve(r.id, "DISMISSED")} className="rounded-full border border-clay px-3 py-1 text-xs text-clay hover:bg-clay/10">Dismiss</button>
                </div>
              )}
            </div>
          ))}
        {!loading && reports.length === 0 && <p className="text-sm text-evergreen-900/60">No reports in this status.</p>}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminReportsContent />
    </ProtectedRoute>
  );
}
