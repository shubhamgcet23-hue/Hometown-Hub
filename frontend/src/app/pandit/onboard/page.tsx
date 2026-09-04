"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, apiErrorMessage } from "@/lib/api";

const initial = {
  name: "",
  location: "",
  description: "",
  experienceYears: "",
  servicesOffered: "",
  contactPhone: "",
  contactEmail: "",
  availability: "",
};

function OnboardForm() {
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
      await api.post("/pandit", {
        ...form,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        servicesOffered: form.servicesOffered.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Your profile has been submitted for verification.");
      router.push("/pandit");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <h1 className="font-display text-2xl text-evergreen-900">Add your profile</h1>
      <p className="mt-1 text-sm text-evergreen-900/70">Submit your details for review — a platform admin will verify your profile before it&apos;s listed publicly.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-evergreen-900">Name</label>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Location</label>
          <input required value={form.location} onChange={(e) => update("location", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-evergreen-900">Years of experience</label>
            <input type="number" min={0} value={form.experienceYears} onChange={(e) => update("experienceYears", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">Availability</label>
            <input value={form.availability} onChange={(e) => update("availability", e.target.value)} placeholder="Weekdays, evenings..." className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Services offered (comma-separated)</label>
          <input value={form.servicesOffered} onChange={(e) => update("servicesOffered", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-evergreen-900">Contact phone</label>
            <input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">Contact email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60">
          {loading ? "Submitting..." : "Submit for verification"}
        </button>
      </form>
    </div>
  );
}

export default function PanditOnboardPage() {
  return (
    <ProtectedRoute>
      <OnboardForm />
    </ProtectedRoute>
  );
}
