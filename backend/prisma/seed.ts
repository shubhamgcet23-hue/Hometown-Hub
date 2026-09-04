/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import slugify from "slugify";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return argon2.hash(pw, { type: argon2.argon2id });
}

async function main() {
  console.log("Seeding Hometown Hub demo data...");

  // ---- Users -----------------------------------------------------------
  const adminPassword = await hash("Admin@12345");
  const userPassword = await hash("Password@123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@hometownhub.dev" },
    update: {},
    create: {
      fullName: "Platform Admin",
      username: "platform_admin",
      email: "admin@hometownhub.dev",
      passwordHash: adminPassword,
      platformRole: "PLATFORM_ADMIN",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      bio: "Keeping Hometown Hub safe and welcoming for everyone.",
    },
  });

  const userSeeds = [
    { fullName: "Aarav Sharma", username: "aarav_sharma", email: "aarav@example.com", city: "Delhi", state: "Delhi" },
    { fullName: "Priya Verma", username: "priya_verma", email: "priya@example.com", city: "Gurugram", state: "Haryana" },
    { fullName: "Rohan Gupta", username: "rohan_gupta", email: "rohan@example.com", city: "Jaipur", state: "Rajasthan" },
    { fullName: "Ananya Singh", username: "ananya_singh", email: "ananya@example.com", city: "Lucknow", state: "Uttar Pradesh" },
    { fullName: "Vikram Rao", username: "vikram_rao", email: "vikram@example.com", city: "Patna", state: "Bihar" },
    { fullName: "Meera Iyer", username: "meera_iyer", email: "meera@example.com", city: "Delhi", state: "Delhi" },
  ];

  const users = [];
  for (const u of userSeeds) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: userPassword, country: "India", bio: `Proud to be from ${u.city}.` },
    });
    users.push(user);
  }
  const [aarav, priya, rohan, ananya, vikram, meera] = users;

  // ---- Communities -------------------------------------------------------
  const communitySeeds = [
    { name: "Hometown Delhi", city: "Delhi", state: "Delhi", createdBy: aarav, category: "City" },
    { name: "Gurugram Community", city: "Gurugram", state: "Haryana", createdBy: priya, category: "City" },
    { name: "Jaipur Hometown", city: "Jaipur", state: "Rajasthan", createdBy: rohan, category: "City" },
    { name: "Lucknow Community", city: "Lucknow", state: "Uttar Pradesh", createdBy: ananya, category: "City" },
    { name: "Patna Hometown", city: "Patna", state: "Bihar", createdBy: vikram, category: "City" },
    { name: "Village Connect", city: "Sonipat", state: "Haryana", createdBy: meera, category: "Village", privacy: "PRIVATE" as const },
    { name: "College Alumni Hometown", city: "Delhi", state: "Delhi", createdBy: admin, category: "Alumni" },
  ];

  const communities = [];
  for (const c of communitySeeds) {
    const slug = slugify(c.name, { lower: true, strict: true });
    const community = await prisma.community.upsert({
      where: { slug },
      update: {},
      create: {
        name: c.name,
        slug,
        city: c.city,
        state: c.state,
        country: "India",
        description: `A digital home for people connected to ${c.city}. Share updates, join events, and stay close to the community you grew up with.`,
        category: c.category,
        rules: "Be respectful. No spam. Keep discussions relevant to the community.",
        privacy: c.privacy || "PUBLIC",
        status: "ACTIVE",
        createdById: c.createdBy.id,
      },
    });
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId: c.createdBy.id } },
      update: { role: "ADMIN" },
      create: { communityId: community.id, userId: c.createdBy.id, role: "ADMIN" },
    });
    communities.push(community);
  }
  const [delhiC, gurugramC, jaipurC] = communities;

  // Add a few extra memberships so feeds/events have participants.
  const extraMemberships: [any, any][] = [
    [delhiC, priya],
    [delhiC, meera],
    [gurugramC, rohan],
    [jaipurC, ananya],
  ];
  for (const [community, user] of extraMemberships) {
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId: user.id } },
      update: {},
      create: { communityId: community.id, userId: user.id, role: "MEMBER" },
    });
  }

  // A pending join request against the private community, for the moderator UI demo.
  await prisma.communityJoinRequest.upsert({
    where: { communityId_userId: { communityId: communities[5].id, userId: rohan.id } },
    update: {},
    create: { communityId: communities[5].id, userId: rohan.id, status: "PENDING" },
  });

  // ---- Posts, comments, likes --------------------------------------------
  const post1 = await prisma.post.create({
    data: {
      communityId: delhiC.id,
      authorId: aarav.id,
      content: "Excited to kick off Hometown Delhi! Introduce yourself below and tell us your favorite spot in the city.",
      type: "ANNOUNCEMENT",
      isPinned: true,
    },
  });
  const post2 = await prisma.post.create({
    data: {
      communityId: delhiC.id,
      authorId: priya.id,
      content: "Does anyone know a good place for street food near CP? Just moved back after years away!",
      type: "DISCUSSION",
    },
  });
  await prisma.post.create({
    data: {
      communityId: gurugramC.id,
      authorId: priya.id,
      content: "Cleanup drive at Sector 29 park this Sunday morning — bring your friends and family!",
      type: "GENERAL",
    },
  });

  await prisma.comment.create({ data: { postId: post1.id, authorId: meera.id, content: "So glad this exists — hi everyone!" } });
  await prisma.comment.create({ data: { postId: post2.id, authorId: aarav.id, content: "Try the chaat stalls near Regal Cinema!" } });
  await prisma.like.createMany({
    data: [
      { postId: post1.id, userId: meera.id },
      { postId: post1.id, userId: priya.id },
      { postId: post2.id, userId: aarav.id },
    ],
    skipDuplicates: true,
  });

  // ---- Announcement --------------------------------------------------------
  await prisma.announcement.create({
    data: {
      communityId: delhiC.id,
      authorId: aarav.id,
      title: "Community guidelines updated",
      description: "Please review the updated community rules pinned in the About section.",
      priority: 1,
      isPinned: true,
    },
  });

  // ---- Events ----------------------------------------------------------
  const startAt = new Date();
  startAt.setDate(startAt.getDate() + 7);
  const endAt = new Date(startAt);
  endAt.setHours(endAt.getHours() + 3);

  const event = await prisma.event.create({
    data: {
      communityId: delhiC.id,
      organizerId: aarav.id,
      title: "Hometown Delhi Meetup",
      description: "A casual get-together for everyone connected to Delhi — food, music, and good conversation.",
      location: "Lodhi Garden, Delhi",
      startAt,
      endAt,
      maxAttendees: 100,
      status: "UPCOMING",
    },
  });
  await prisma.eventAttendee.createMany({
    data: [
      { eventId: event.id, userId: priya.id },
      { eventId: event.id, userId: meera.id },
    ],
    skipDuplicates: true,
  });

  // ---- Notifications -----------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        userId: priya.id,
        type: "NEW_POST",
        title: "New post in Hometown Delhi",
        message: post1.content.slice(0, 100),
        relatedEntity: post1.id,
      },
      {
        userId: aarav.id,
        type: "EVENT_REGISTRATION",
        title: "New event registration",
        message: "Priya Verma joined your event.",
        relatedEntity: event.id,
      },
    ],
  });

  // ---- Reports -----------------------------------------------------------
  await prisma.report.create({
    data: {
      reporterId: meera.id,
      targetType: "POST",
      postId: post2.id,
      communityId: delhiC.id,
      reason: "SPAM",
      description: "This looks like a duplicate of another post.",
      status: "PENDING",
    },
  });

  console.log("Seed complete.");
  console.log("Admin login:    admin@hometownhub.dev / Admin@12345");
  console.log("Sample user:    aarav@example.com / Password@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
