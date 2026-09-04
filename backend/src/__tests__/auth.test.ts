import request from "supertest";
import { app } from "../app";
import { prisma } from "../config/db";

// These integration tests expect a real PostgreSQL database reachable via
// DATABASE_URL (use a disposable test database, then run:
//   npx prisma migrate deploy && npm test
const testEmail = `test-${Date.now()}@example.com`;

describe("Auth API", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("registers a new user with valid data", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Test User",
      username: `test_user_${Date.now()}`,
      email: testEmail,
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
      city: "Delhi",
      state: "Delhi",
      country: "India",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects registration with a weak password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Weak Pass",
      username: `weak_${Date.now()}`,
      email: `weak-${Date.now()}@example.com`,
      password: "weak",
      confirmPassword: "weak",
      city: "Delhi",
      state: "Delhi",
      country: "India",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects login with wrong credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: testEmail, password: "WrongPassword1!" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: testEmail, password: "StrongPass1!" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });
});
