"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Wraps authenticated-only pages; also supports role gating via
// `requireAdmin`, which redirects non-platform-admins back home.
export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && user.platformRole !== "PLATFORM_ADMIN") {
      router.replace("/");
    }
  }, [user, loading, requireAdmin, router]);

  if (loading || !user || (requireAdmin && user.platformRole !== "PLATFORM_ADMIN")) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-evergreen-700">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
