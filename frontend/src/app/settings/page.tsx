"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api, apiErrorMessage } from "@/lib/api";

function SettingsContent() {
  const { user, refreshUser, logout } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    hometown: user?.hometown || "",
    city: user?.city || "",
    state: user?.state || "",
    country: user?.country || "",
  });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, form);
      await refreshUser();
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (!user) return;
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success("Account deleted.");
      logout();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-lg py-4">
      <h1 className="font-display text-2xl text-evergreen-900">Account settings</h1>
      <p className="mt-1 text-sm text-evergreen-900/70">Update your profile details.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-evergreen-900">Full name</label>
          <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Bio</label>
          <textarea rows={3} value={form.bio} onChange={(e) => update("bio", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900">Hometown</label>
          <input value={form.hometown} onChange={(e) => update("hometown", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-evergreen-900">City</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">State</label>
            <input value={form.state} onChange={(e) => update("state", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-evergreen-900">Country</label>
            <input value={form.country} onChange={(e) => update("country", e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60">
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="mt-10 rounded-card border border-clay/30 bg-clay/5 p-4">
        <h2 className="text-sm font-medium text-clay">Danger zone</h2>
        <p className="mt-1 text-xs text-evergreen-900/70">Deleting your account removes your profile and content permanently.</p>
        <button onClick={deleteAccount} className="mt-3 rounded-full border border-clay px-4 py-1.5 text-xs text-clay hover:bg-clay/10">
          Delete account
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
