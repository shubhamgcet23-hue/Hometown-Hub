"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/feed");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="font-display text-2xl text-evergreen-900">Log in</h1>
      <p className="mt-1 text-sm text-evergreen-900/70">Welcome back to your hometown.</p>

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
        <div>
          <label className="text-sm font-medium text-evergreen-900" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500"
          />
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-evergreen-600 hover:underline">Forgot password?</Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-evergreen-900/70">
        New here? <Link href="/register" className="font-medium text-evergreen-700 hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
