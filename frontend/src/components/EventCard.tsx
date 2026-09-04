import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Users } from "lucide-react";
import { EventItem } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: "bg-evergreen-50 text-evergreen-700",
  ONGOING: "bg-lantern-400/20 text-lantern-600",
  COMPLETED: "bg-evergreen-100 text-evergreen-900/60",
  CANCELLED: "bg-clay/10 text-clay",
};

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <Link href={`/events/${event.id}`} className="block rounded-card border border-evergreen-100 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-evergreen-900/60">{format(new Date(event.startAt), "EEE, MMM d · h:mm a")}</p>
          <h3 className="mt-1 font-display text-lg text-evergreen-900">{event.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[event.status]}`}>{event.status}</span>
      </div>
      <p className="mt-2 flex items-center gap-1 text-sm text-evergreen-900/70">
        <MapPin size={14} /> {event.location}
      </p>
      <p className="mt-1 text-xs text-evergreen-900/60">{event.community.name}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-evergreen-900/60">
        <span className="flex items-center gap-1">
          <Users size={13} /> {event._count.attendees}
          {event.maxAttendees ? ` / ${event.maxAttendees}` : ""} attending
        </span>
        <span>Organised by {event.organizer.fullName}</span>
      </div>
    </Link>
  );
}
