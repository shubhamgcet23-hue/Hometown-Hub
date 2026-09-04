"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Home, Search, Users, CalendarDays, Menu, X, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get("/notifications", { params: { limit: 1 } })
      .then((res) => setUnread(res.data.data.unreadCount))
      .catch(() => {});
  }, [user, pathname]);

  const navLink = (href: string, label: string, Icon: any) => (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
        pathname === href ? "bg-evergreen-700 text-paper" : "text-evergreen-900 hover:bg-evergreen-100"
      }`}
    >
      <Icon size={17} />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-evergreen-100 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl text-evergreen-900">
          Hometown Hub
        </Link>

        {user ? (
          <nav className="hidden items-center gap-1 md:flex">
            {navLink("/feed", "Feed", Home)}
            {navLink("/communities", "Communities", Users)}
            {navLink("/events", "Events", CalendarDays)}
            {navLink("/search", "Search", Search)}
            <Link
              href="/notifications"
              className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm text-evergreen-900 hover:bg-evergreen-100"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-clay text-[10px] text-paper">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            {user.platformRole === "PLATFORM_ADMIN" && navLink("/admin", "Admin", ShieldCheck)}
            <Link href={`/profile/${user.username}`} className="ml-1 flex items-center gap-2 rounded-full border border-evergreen-200 pl-1 pr-3 py-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-evergreen-600 text-xs text-paper">
                {user.fullName.charAt(0)}
              </span>
              <span className="hidden text-sm text-evergreen-900 md:inline">{user.fullName.split(" ")[0]}</span>
            </Link>
            <button onClick={logout} className="ml-1 rounded-full px-3 py-2 text-sm text-evergreen-700 hover:bg-evergreen-100">
              Log out
            </button>
          </nav>
        ) : (
          <nav className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm text-evergreen-900 hover:bg-evergreen-100">
              Log in
            </Link>
            <Link href="/register" className="rounded-full bg-evergreen-700 px-4 py-2 text-sm text-paper hover:bg-evergreen-600">
              Join your hometown
            </Link>
          </nav>
        )}

        <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-evergreen-100 px-4 py-3 md:hidden">
          {user ? (
            <div className="flex flex-col gap-1">
              <Link href="/feed" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Feed</Link>
              <Link href="/communities" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Communities</Link>
              <Link href="/events" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Events</Link>
              <Link href="/notifications" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Notifications {unread > 0 ? `(${unread})` : ""}</Link>
              <Link href={`/profile/${user.username}`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Profile</Link>
              {user.platformRole === "PLATFORM_ADMIN" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Admin dashboard</Link>
              )}
              <button onClick={logout} className="rounded-lg px-3 py-2 text-left text-sm text-clay hover:bg-evergreen-100">Log out</button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Log in</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-evergreen-100">Join your hometown</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
