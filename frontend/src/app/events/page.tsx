"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import EventCard from "@/components/EventCard";
import { api } from "@/lib/api";
import { EventItem } from "@/types";

function EventsContent() {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [events, setEvents] = useState<EventItem[] | null>(null);

  useEffect(() => {
    setEvents(null);
    api.get("/events", { params: tab === "mine" ? { mine: "1" } : {} }).then((res) => setEvents(res.data.data.events));
  }, [tab]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-evergreen-900">Events</h1>
          <p className="text-sm text-evergreen-900/70">Meetups, festivals, and drives happening in your communities.</p>
        </div>
        <Link href="/events/create" className="flex items-center gap-1.5 self-start rounded-full bg-evergreen-700 px-4 py-2 text-sm text-paper hover:bg-evergreen-600">
          <Plus size={16} /> Create event
        </Link>
      </div>

      <div className="mt-6 flex gap-1 border-b border-evergreen-100">
        {(["all", "mine"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-evergreen-700 text-evergreen-900" : "text-evergreen-900/60"}`}>
            {t === "all" ? "All events" : "My events"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {events === null && <p className="text-sm text-evergreen-900/60">Loading events...</p>}
        {events?.map((e) => <EventCard key={e.id} event={e} />)}
        {events?.length === 0 && <p className="text-sm text-evergreen-900/60">No events to show.</p>}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
