"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { Notification } from "@/types";

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  const load = useCallback(() => {
    api.get("/notifications").then((res) => setNotifications(res.data.data.notifications));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    await api.put(`/notifications/${id}/read`);
    load();
  }

  async function markAllRead() {
    await api.put("/notifications/read-all");
    load();
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-evergreen-900">Notifications</h1>
        <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-evergreen-700 hover:underline">
          <CheckCheck size={15} /> Mark all as read
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {notifications === null && <p className="text-sm text-evergreen-900/60">Loading notifications...</p>}
        {notifications?.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`flex w-full items-start gap-3 rounded-card border p-3 text-left ${
              n.isRead ? "border-evergreen-100 bg-white" : "border-evergreen-300 bg-evergreen-50"
            }`}
          >
            <Bell size={16} className="mt-0.5 shrink-0 text-evergreen-600" />
            <div>
              <p className="text-sm font-medium text-evergreen-900">{n.title}</p>
              <p className="text-sm text-evergreen-900/70">{n.message}</p>
              <p className="mt-1 text-xs text-evergreen-900/50">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
            </div>
          </button>
        ))}
        {notifications?.length === 0 && <p className="py-8 text-center text-sm text-evergreen-900/60">You&apos;re all caught up.</p>}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
