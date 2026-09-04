"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { api, apiErrorMessage } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password, confirmPassword });
      toast.success("Password reset. Please log in.");
      router.push("/login");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="font-display text-2xl text-evergreen-900">Reset password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium text-evergreen-900" htmlFor="token">Reset token</label>
          <input id="token" required value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900" htmlFor="password">New password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-evergreen-900" htmlFor="confirmPassword">Confirm new password</label>
          <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60">
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
