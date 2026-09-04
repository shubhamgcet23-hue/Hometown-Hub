# Hometown Hub — API Reference

Base URL: `http://localhost:4000/api` (development)

All responses follow a consistent envelope:

```json
{ "success": true, "message": "Operation successful", "data": {} }
{ "success": false, "message": "Error message", "data": null }
```

Authenticated requests accept either an `Authorization: Bearer <token>`
header or the `token` httpOnly cookie set on login/register.

---

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create an account |
| POST | `/auth/login` | — | Log in |
| POST | `/auth/logout` | — | Clear session cookie |
| POST | `/auth/forgot-password` | — | Request a reset token |
| POST | `/auth/reset-password` | — | Reset password with token |
| GET | `/auth/me` | ✅ | Get the current user |

## Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users?q=` | ✅ | Search users |
| GET | `/users/:username` | — | Public profile |
| PUT | `/users/:id` | ✅ (self) | Update profile |
| DELETE | `/users/:id` | ✅ (self/admin) | Delete account |

## Communities

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/communities?q=&city=&category=` | — | Browse/search communities |
| GET | `/communities/:id` | — | Get by id or slug |
| POST | `/communities` | ✅ | Request a new community (status: PENDING) |
| PUT | `/communities/:id` | ✅ community admin | Update community |
| DELETE | `/communities/:id` | ✅ community admin | Delete community |
| POST | `/communities/:id/join` | ✅ | Join (public) or request to join (private) |
| POST | `/communities/:id/leave` | ✅ | Leave a community |
| GET | `/communities/:id/members` | — / ✅ if private | List members |
| GET | `/communities/:id/join-requests` | ✅ moderator | List pending join requests |
| POST | `/communities/:id/members/:userId/approve` | ✅ moderator | Approve join request |
| POST | `/communities/:id/members/:userId/reject` | ✅ moderator | Reject join request |
| DELETE | `/communities/:id/members/:userId` | ✅ moderator | Remove a member |
| PUT | `/communities/:id/members/:userId/role` | ✅ admin | Change member role |

## Posts, comments, likes, shares

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/posts?communityId=` | — / ✅ | Feed (home feed if no communityId) |
| POST | `/posts` | ✅ member | Create a post |
| GET | `/posts/:id` | — | Get a post |
| PUT | `/posts/:id` | ✅ owner | Edit a post |
| DELETE | `/posts/:id` | ✅ owner/moderator | Delete a post |
| POST | `/posts/:id/pin` | — | Toggle pin (route-level; enforce moderator in production) |
| POST | `/posts/:id/like` / `DELETE .../like` | ✅ | Like / unlike |
| POST | `/posts/:id/share` | ✅ | Share |
| GET | `/posts/:id/comments` | — | List comments |
| POST | `/posts/:id/comments` | ✅ | Add comment |
| DELETE | `/posts/:id/comments/:commentId` | ✅ owner/moderator | Delete comment |
| POST | `/posts/:id/report` | ✅ | Report a post |

## Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events?communityId=&mine=` | — / ✅ | List events |
| POST | `/events` | ✅ member | Create event |
| GET | `/events/:id` | — | Event detail + attendees |
| PUT | `/events/:id` | ✅ organizer/moderator | Update event |
| DELETE | `/events/:id` | ✅ organizer/moderator | Delete event |
| POST | `/events/:id/join` / `DELETE .../join` | ✅ | Join / leave event |

## Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✅ | List notifications |
| PUT | `/notifications/:id/read` | ✅ | Mark one as read |
| PUT | `/notifications/read-all` | ✅ | Mark all as read |

## Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reports?status=&communityId=` | ✅ moderator/admin | List reports (scoped to moderated communities unless platform admin) |
| POST | `/reports` | ✅ | File a report |
| PUT | `/reports/:id` | ✅ moderator/admin | Resolve/dismiss a report |

## Admin (platform admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | KPI cards + 14-day growth charts |
| GET | `/admin/users?q=&status=` | List all users |
| PUT | `/admin/users/:id/status` | Suspend / activate a user |
| GET | `/admin/communities?status=` | List all communities |
| PUT | `/admin/communities/:id/status` | Approve / reject / suspend a community |

## Pandit onboarding (local services directory)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/pandit` | ✅ | Submit a profile |
| GET | `/pandit?communityId=&status=` | — | List profiles (verified only by default) |
| GET | `/pandit/:id` | — | Get a profile |
| PUT | `/pandit/:id` | ✅ owner/admin | Update profile |
| PUT | `/pandit/:id/verify` | ✅ platform admin | Verify or reject |

## Search & uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search?q=&type=&city=&category=` | Global search across communities/users/posts/events |
| POST | `/upload/image` | Upload a single image (multipart, field `image`) |
| POST | `/upload/images` | Upload up to 6 images (multipart, field `images`) |

---

### Error format

```json
{ "success": false, "message": "You don't have permission to perform this action.", "data": null }
```

Common HTTP status codes: `400` validation error, `401` unauthenticated,
`403` unauthorized, `404` not found, `409` conflict (duplicate), `500`
server error.
