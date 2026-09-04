import request from "supertest";
import { app } from "../app";
import { prisma } from "../config/db";

describe("Community API", () => {
  let token: string;
  let userId: string;
  const email = `community-owner-${Date.now()}@example.com`;

  beforeAll(async () => {
    const register = await request(app).post("/api/auth/register").send({
      fullName: "Community Owner",
      username: `owner_${Date.now()}`,
      email,
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
    });
    token = register.body.data.token;
    userId = register.body.data.user.id;
  });

  afterAll(async () => {
    // Delete any community this user created first — Community.createdById
    // is a RESTRICT foreign key, so the user can't be deleted while they
    // still own a community.
    await prisma.community.deleteMany({ where: { createdById: userId } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("requires authentication to create a community", async () => {
    const res = await request(app).post("/api/communities").send({
      name: "Unauthorized Community",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      description: "Should not be allowed without auth.",
    });
    expect(res.status).toBe(401);
  });

  it("creates a community request that starts as PENDING", async () => {
    const res = await request(app)
      .post("/api/communities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: `Test Community ${Date.now()}`,
        city: "Jaipur",
        state: "Rajasthan",
        country: "India",
        description: "A community created during automated testing.",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.community.status).toBe("PENDING");
  });
});