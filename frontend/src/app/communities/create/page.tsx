"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, apiErrorMessage } from "@/lib/api";

const initial = {
  name: "",
  city: "",
  state: "",
  country: "",
  description: "",
  category: "",
  rules: "",
  privacy: "PUBLIC" as "PUBLIC" | "PRIVATE",
};

function CreateCommunityForm() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/communities", form);
      toast.success("Your community request has been submitted for review.");
      router.push("/communities");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <h1 className="font-display text-2xl text-evergreen-900">Create a community</h1>
      <p className="mt-1 text-sm text-evergreen-900/70">
        New communities are reviewed by a platform admin before they go live. You&apos;ll become the community admin once it&apos;s approved.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-evergreen-900">Community name</label>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-evergreen-900">City/Village</label>
            <input required value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">State</label>
            <input required value={form.state} onChange={(e) => update("state", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">Country</label>
            <input required value={form.country} onChange={(e) => update("country", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Description</label>
          <textarea required rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-evergreen-900">Category</label>
            <input value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="City, Village, Alumni..." className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">Privacy</label>
            <select value={form.privacy} onChange={(e) => update("privacy", e.target.value as "PUBLIC" | "PRIVATE")} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500">
              <option value="PUBLIC">Public — anyone can join</option>
              <option value="PRIVATE">Private — requests reviewed by moderators</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Community rules (optional)</label>
          <textarea rows={2} value={form.rules} onChange={(e) => update("rules", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60">
          {loading ? "Submitting..." : "Submit for review"}
        </button>
      </form>
    </div>
  );
}

export default function CreateCommunityPage() {
  return (
    <ProtectedRoute>
      <CreateCommunityForm />
    </ProtectedRoute>
  );
}
