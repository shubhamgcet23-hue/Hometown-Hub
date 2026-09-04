"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (res.data.data?.devResetToken) setDevToken(res.data.data.devResetToken);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="font-display text-2xl text-evergreen-900">Forgot password</h1>
      <p className="mt-1 text-sm text-evergreen-900/70">We&apos;ll send a reset link to your email.</p>

      {sent ? (
        <div className="mt-8 rounded-lg border border-evergreen-100 bg-white p-4 text-sm text-evergreen-900">
          If that email exists, a reset link has been sent.
          {devToken && (
            <p className="mt-3">
              Development mode — <Link className="font-medium text-evergreen-700 underline" href={`/reset-password?token=${devToken}`}>reset your password here</Link>.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-evergreen-900" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
