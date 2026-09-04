"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, apiErrorMessage } from "@/lib/api";
import { User } from "@/types";

function AdminUsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/admin/users", { params: q ? { q } : {} })
      .then((res) => setUsers(res.data.data.users))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  async function toggleStatus(user: User) {
    const status = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.put(`/admin/users/${user.id}/status`, { status });
      toast.success(status === "SUSPENDED" ? "User suspended." : "User activated.");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-evergreen-900">User management</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        className="mt-4 w-full max-w-sm rounded-full border border-evergreen-200 px-4 py-2 text-sm outline-none focus:border-evergreen-500"
      />

      <div className="mt-6 overflow-x-auto rounded-card border border-evergreen-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-evergreen-100 text-left text-xs text-evergreen-900/60">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-evergreen-900/60">Loading users...</td></tr>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-b border-evergreen-50">
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3 text-evergreen-900/70">{u.email}</td>
                <td className="px-4 py-3">{u.platformRole === "PLATFORM_ADMIN" ? "Admin" : "User"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "ACTIVE" ? "bg-evergreen-50 text-evergreen-700" : "bg-clay/10 text-clay"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleStatus(u)} className="text-xs font-medium text-evergreen-700 hover:underline">
                    {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-evergreen-900/60">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}
