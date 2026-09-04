"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";

interface DashboardData {
  cards: {
    totalUsers: number;
    activeUsers: number;
    totalCommunities: number;
    pendingCommunities: number;
    totalPosts: number;
    totalEvents: number;
    pendingReports: number;
    activeModerators: number;
  };
  charts: {
    userGrowth: Record<string, number>;
    communityGrowth: Record<string, number>;
    postsPerDay: Record<string, number>;
  };
}

const CARD_LABELS: [keyof DashboardData["cards"], string][] = [
  ["totalUsers", "Total users"],
  ["activeUsers", "Active users"],
  ["totalCommunities", "Total communities"],
  ["pendingCommunities", "Pending communities"],
  ["totalPosts", "Total posts"],
  ["totalEvents", "Total events"],
  ["pendingReports", "Pending reports"],
  ["activeModerators", "Active moderators"],
];

function AdminHome() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setData(res.data.data));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-evergreen-900">Platform admin dashboard</h1>

      <nav className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin" className="rounded-full bg-evergreen-700 px-4 py-1.5 text-sm text-paper">Dashboard</Link>
        <Link href="/admin/users" className="rounded-full bg-evergreen-50 px-4 py-1.5 text-sm text-evergreen-900 hover:bg-evergreen-100">Users</Link>
        <Link href="/admin/communities" className="rounded-full bg-evergreen-50 px-4 py-1.5 text-sm text-evergreen-900 hover:bg-evergreen-100">Communities</Link>
        <Link href="/admin/reports" className="rounded-full bg-evergreen-50 px-4 py-1.5 text-sm text-evergreen-900 hover:bg-evergreen-100">Reports</Link>
      </nav>

      {!data ? (
        <p className="mt-8 text-sm text-evergreen-900/60">Loading dashboard...</p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CARD_LABELS.map(([key, label]) => (
              <div key={key} className="rounded-card border border-evergreen-100 bg-white p-4">
                <p className="text-xs text-evergreen-900/60">{label}</p>
                <p className="mt-1 font-display text-2xl text-evergreen-900">{data.cards[key]}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <GrowthChart title="User growth (14 days)" series={data.charts.userGrowth} />
            <GrowthChart title="Community growth (14 days)" series={data.charts.communityGrowth} />
            <GrowthChart title="Posts per day (14 days)" series={data.charts.postsPerDay} />
          </div>
        </>
      )}
    </div>
  );
}

function GrowthChart({ title, series }: { title: string; series: Record<string, number> }) {
  const entries = Object.entries(series).sort(([a], [b]) => (a > b ? 1 : -1));
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className="rounded-card border border-evergreen-100 bg-white p-4">
      <p className="text-sm font-medium text-evergreen-900">{title}</p>
      <div className="mt-4 flex h-24 items-end gap-1">
        {entries.map(([date, value]) => (
          <div key={date} className="flex-1 rounded-t bg-evergreen-500" style={{ height: `${(value / max) * 100}%` }} title={`${date}: ${value}`} />
        ))}
        {entries.length === 0 && <p className="text-xs text-evergreen-900/50">No activity yet.</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminHome />
    </ProtectedRoute>
  );
}
