export interface User {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  bio?: string | null;
  profileImage?: string | null;
  hometown?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  platformRole: "USER" | "PLATFORM_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  description: string;
  coverImage?: string | null;
  logoImage?: string | null;
  rules?: string | null;
  category?: string | null;
  privacy: "PUBLIC" | "PRIVATE";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  createdById: string;
  createdAt: string;
  _count?: { members: number; posts: number; events?: number };
}

export interface Post {
  id: string;
  authorId: string;
  communityId: string;
  content: string;
  type: "GENERAL" | "ANNOUNCEMENT" | "DISCUSSION" | "EVENT" | "POLL";
  status: "PUBLISHED" | "REMOVED";
  isPinned: boolean;
  createdAt: string;
  author: { id: string; fullName: string; username: string; profileImage?: string | null };
  community: { id: string; name: string; slug: string };
  images: { id: string; url: string }[];
  _count: { likes: number; comments: number; shares: number };
  likedByMe?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: { id: string; fullName: string; username: string; profileImage?: string | null };
}

export interface EventItem {
  id: string;
  communityId: string;
  title: string;
  description: string;
  coverImage?: string | null;
  location: string;
  startAt: string;
  endAt: string;
  maxAttendees?: number | null;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  organizer: { id: string; fullName: string; username: string; profileImage?: string | null };
  community: { id: string; name: string; slug: string };
  _count: { attendees: number };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedEntity?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
