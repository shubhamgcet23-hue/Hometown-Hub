import Link from "next/link";
import { MapPin, MessageCircle, CalendarHeart, Landmark, ArrowUpRight } from "lucide-react";

const steps = [
  {
    title: "Find your hometown",
    body: "Search by city, village, or region and discover the community already gathering there.",
  },
  {
    title: "Join and introduce yourself",
    body: "Public communities welcome you instantly; private ones review your request within a day.",
  },
  {
    title: "Share, plan, and show up",
    body: "Post updates, organise a meetup, or just read what your hometown has been up to.",
  },
];

const pillars = [
  {
    icon: MapPin,
    title: "Discover your hometown",
    body: "Every city and village gets its own space — no more scrolling through unrelated feeds to find local news.",
  },
  {
    icon: MessageCircle,
    title: "Connect with people",
    body: "Reconnect with old neighbours and meet new ones who share the same roots, wherever you live now.",
  },
  {
    icon: CalendarHeart,
    title: "Join local events",
    body: "Meetups, festivals, cleanup drives, fundraisers — organised by the community, for the community.",
  },
  {
    icon: Landmark,
    title: "Preserve local culture",
    body: "Traditions, stories, and historical places stay alive when the people who remember them keep sharing.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-6 md:grid-cols-2 md:pt-14">
        <div>
          <p className="mb-4 text-sm font-medium text-evergreen-600">A digital home for every hometown</p>
          <h1 className="font-display text-4xl leading-tight text-evergreen-900 sm:text-5xl">
            Your hometown. Your community. Your digital home.
          </h1>
          <p className="mt-5 max-w-md text-lg text-evergreen-900/80">
            Reconnect with the people, places, events, and stories that make your hometown special — wherever
            life has taken you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/communities" className="rounded-full bg-evergreen-700 px-6 py-3 text-sm font-medium text-paper hover:bg-evergreen-600">
              Find your community
            </Link>
            <Link href="/register?intent=create" className="rounded-full border border-evergreen-300 px-6 py-3 text-sm font-medium text-evergreen-900 hover:bg-evergreen-100">
              Create a community
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-card border border-evergreen-100 bg-white p-6 shadow-sm">
            <p className="font-display text-sm text-lantern-600">Hometown Delhi</p>
            <p className="mt-1 text-2xl font-display text-evergreen-900">2,140 members</p>
            <div className="mt-5 space-y-3 border-t border-evergreen-100 pt-4">
              <div className="rounded-lg bg-paper p-3">
                <p className="text-sm text-evergreen-900/90">Meera Iyer pinned an announcement about the winter mela.</p>
              </div>
              <div className="rounded-lg bg-paper p-3">
                <p className="text-sm text-evergreen-900/90">42 people are attending &ldquo;Hometown Delhi Meetup&rdquo; on Saturday.</p>
              </div>
              <div className="rounded-lg bg-paper p-3">
                <p className="text-sm text-evergreen-900/90">Aarav Sharma asked for chaat recommendations near CP.</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-card bg-lantern-500 px-4 py-3 text-sm text-white shadow-md sm:block">
            7 communities founded near you
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-display text-2xl text-evergreen-900">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-card border border-evergreen-100 bg-white p-6">
              <p className="text-sm text-lantern-600">{`Step ${i + 1}`}</p>
              <h3 className="mt-2 font-display text-lg text-evergreen-900">{step.title}</h3>
              <p className="mt-2 text-sm text-evergreen-900/75">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section>
        <h2 className="font-display text-2xl text-evergreen-900">Built for one thing: your hometown</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-card border border-evergreen-100 bg-white p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-evergreen-100 text-evergreen-700">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg text-evergreen-900">{title}</h3>
                <p className="mt-1 text-sm text-evergreen-900/75">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="rounded-card bg-evergreen-900 px-6 py-12 text-paper sm:px-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-4xl">120+</p>
            <p className="mt-1 text-sm text-paper/70">Hometown communities active</p>
          </div>
          <div>
            <p className="font-display text-4xl">18k</p>
            <p className="mt-1 text-sm text-paper/70">Members reconnected so far</p>
          </div>
          <div>
            <p className="font-display text-4xl">640</p>
            <p className="mt-1 text-sm text-paper/70">Local events organised</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="font-display text-2xl text-evergreen-900">From people who found their way back</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <blockquote className="rounded-card border border-evergreen-100 bg-white p-6">
            <p className="text-evergreen-900/90">
              &ldquo;I moved to Bangalore for work and lost touch with almost everyone from Patna. This is the first
              place that made reconnecting feel effortless.&rdquo;
            </p>
            <p className="mt-4 text-sm font-medium text-evergreen-700">— Community member, Patna Hometown</p>
          </blockquote>
          <blockquote className="rounded-card border border-evergreen-100 bg-white p-6">
            <p className="text-evergreen-900/90">
              &ldquo;We organised our first cleanup drive through the platform and thirty people showed up. It would
              never have happened over scattered WhatsApp groups.&rdquo;
            </p>
            <p className="mt-4 text-sm font-medium text-evergreen-700">— Moderator, Gurugram Community</p>
          </blockquote>
        </div>
      </section>

      {/* Final CTA */}
      <section className="flex flex-col items-start justify-between gap-6 rounded-card border border-evergreen-100 bg-white p-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl text-evergreen-900">Ready to find your people?</h2>
          <p className="mt-1 text-evergreen-900/75">It takes less than a minute to join your hometown community.</p>
        </div>
        <Link href="/register" className="flex items-center gap-2 rounded-full bg-lantern-500 px-6 py-3 text-sm font-medium text-white hover:bg-lantern-600">
          Get started <ArrowUpRight size={16} />
        </Link>
      </section>
    </div>
  );
}
