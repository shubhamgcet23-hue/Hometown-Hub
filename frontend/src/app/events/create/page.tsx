"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, apiErrorMessage } from "@/lib/api";
import { Community } from "@/types";

function CreateEventForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [form, setForm] = useState({
    communityId: params.get("communityId") || "",
    title: "",
    description: "",
    location: "",
    startAt: "",
    endAt: "",
    maxAttendees: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/communities").then((res) => setCommunities(res.data.data.communities));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/events", {
        ...form,
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
      });
      toast.success("Event created successfully.");
      router.push("/events");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <h1 className="font-display text-2xl text-evergreen-900">Create an event</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-evergreen-900">Community</label>
          <select required value={form.communityId} onChange={(e) => update("communityId", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500">
            <option value="">Select a community</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Title</label>
          <input required value={form.title} onChange={(e) => update("title", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Description</label>
          <textarea required rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Location</label>
          <input required value={form.location} onChange={(e) => update("location", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-evergreen-900">Starts at</label>
            <input required type="datetime-local" value={form.startAt} onChange={(e) => update("startAt", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">Ends at</label>
            <input required type="datetime-local" value={form.endAt} onChange={(e) => update("endAt", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Max attendees (optional)</label>
          <input type="number" min={1} value={form.maxAttendees} onChange={(e) => update("maxAttendees", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60">
          {loading ? "Creating..." : "Create event"}
        </button>
      </form>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <CreateEventForm />
      </Suspense>
    </ProtectedRoute>
  );
}
