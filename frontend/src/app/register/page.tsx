"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";

const initialState = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  hometown: "",
  city: "",
  state: "",
  country: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof initialState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Welcome to Hometown Hub.");
      router.push("/feed");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const field = (
    key: keyof typeof initialState,
    label: string,
    type = "text",
    required = true
  ) => (
    <div>
      <label className="text-sm font-medium text-evergreen-900" htmlFor={key}>{label}</label>
      <input
        id={key}
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        className="mt-1 w-full rounded-lg border border-evergreen-200 px-3 py-2 text-sm outline-none focus:border-evergreen-500"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-lg py-12">
      <h1 className="font-display text-2xl text-evergreen-900">Create your account</h1>
      <p className="mt-1 text-sm text-evergreen-900/70">Tell us where you&apos;re from, and we&apos;ll help you find your community.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("fullName", "Full name")}
          {field("username", "Username")}
        </div>
        {field("email", "Email", "email")}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("password", "Password", "password")}
          {field("confirmPassword", "Confirm password", "password")}
        </div>
        <p className="text-xs text-evergreen-900/60">
          Must be at least 8 characters with an uppercase letter, lowercase letter, number, and special character.
        </p>
        {field("hometown", "Hometown (optional)", "text", false)}
        <div className="grid gap-4 sm:grid-cols-3">
          {field("city", "City/Village")}
          {field("state", "State")}
          {field("country", "Country")}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-evergreen-700 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-600 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-evergreen-900/70">
        Already have an account? <Link href="/login" className="font-medium text-evergreen-700 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
