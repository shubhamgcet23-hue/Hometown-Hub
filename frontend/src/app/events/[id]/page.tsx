"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Users } from "lucide-react";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";
import { EventItem } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface EventDetail extends EventItem {
  attendees: { id: string; user: { id: string; fullName: string; username: string } }[];
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get(`/events/${id}`)
      .then((res) => setEvent(res.data.data.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isAttending = event?.attendees.some((a) => a.user.id === user?.id);

  async function join() {
    if (!user) return toast.error("Log in to join this event.");
    setBusy(true);
    try {
      await api.post(`/events/${id}/join`);
      toast.success("You've joined the event.");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    try {
      await api.delete(`/events/${id}/join`);
      toast.success("You've left the event.");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-evergreen-900/60">Loading event...</div>;
  if (!event) return <div className="py-16 text-center text-evergreen-900/60">Unable to load event.</div>;

  const full = !!event.maxAttendees && event._count.attendees >= event.maxAttendees;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-evergreen-900/60">
        <Link href={`/communities/${event.community.slug}`} className="hover:underline">{event.community.name}</Link>
      </p>
      <h1 className="mt-1 font-display text-3xl text-evergreen-900">{event.title}</h1>
      <p className="mt-2 text-sm text-evergreen-900/70">{format(new Date(event.startAt), "EEEE, MMMM d, yyyy · h:mm a")} – {format(new Date(event.endAt), "h:mm a")}</p>
      <p className="mt-1 flex items-center gap-1 text-sm text-evergreen-900/70"><MapPin size={14} /> {event.location}</p>
      <p className="mt-1 text-sm text-evergreen-900/70">Organised by {event.organizer.fullName}</p>

      <p className="mt-6 whitespace-pre-wrap text-evergreen-900/90">{event.description}</p>

      <div className="mt-6 flex items-center gap-4">
        {isAttending ? (
          <button onClick={leave} disabled={busy} className="rounded-full border border-evergreen-300 px-5 py-2 text-sm text-evergreen-900 hover:bg-evergreen-50 disabled:opacity-60">
            Leave event
          </button>
        ) : (
          <button onClick={join} disabled={busy || full || event.status === "CANCELLED"} className="rounded-full bg-evergreen-700 px-5 py-2 text-sm text-paper hover:bg-evergreen-600 disabled:opacity-60">
            {full ? "Event full" : "Join event"}
          </button>
        )}
        <span className="flex items-center gap-1 text-sm text-evergreen-900/70">
          <Users size={15} /> {event._count.attendees}{event.maxAttendees ? ` / ${event.maxAttendees}` : ""} attending
        </span>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg text-evergreen-900">Attendees</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {event.attendees.map((a) => (
            <Link key={a.id} href={`/profile/${a.user.username}`} className="flex items-center gap-2 rounded-card border border-evergreen-100 bg-white p-2 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-evergreen-600 text-xs text-paper">{a.user.fullName.charAt(0)}</span>
              {a.user.fullName}
            </Link>
          ))}
          {event.attendees.length === 0 && <p className="text-sm text-evergreen-900/60">No one has joined yet — be the first.</p>}
        </div>
      </div>
    </div>
  );
}
