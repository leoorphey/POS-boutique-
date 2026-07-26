import { beforeEach, describe, expect, it, vi } from "vitest";
import supertest from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "@/app";
import { prisma } from "@/config/prisma";
import { emailService } from "@/services/email.service";

vi.mock("@/services/email.service", async () => {
  const actual = await vi.importActual<typeof import("@/services/email.service")>("@/services/email.service");
  return {
    ...actual,
    emailService: {
      ...actual.emailService,
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe("password reset flow", () => {
  const app = createApp();
  const request = supertest(app);

  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: "reset-flow-test" } } });
  });

  it("crée un token et permet de réinitialiser le mot de passe d'un administrateur", async () => {
    const email = `admin-reset-flow-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash("OldPassword123!", 10);

    const createdUser = await prisma.user.create({
      data: {
        nom: "Admin Test",
        email,
        password: passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    const forgotResponse = await request.post("/api/v1/auth/forgot-password").send({ email });
    expect(forgotResponse.status).toBe(200);
    expect(forgotResponse.body.success).toBe(true);

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: createdUser.id } });
    expect(updatedUser.resetPasswordToken).toBeTruthy();
    expect(updatedUser.resetPasswordExpires).toBeTruthy();

    const resetMailArgs = vi.mocked(emailService.sendPasswordResetEmail).mock.calls[0]?.[0];
    const rawToken = resetMailArgs?.resetUrl.split("/reset-password/").pop();
    expect(rawToken).toBeTruthy();

    const resetResponse = await request
      .post(`/api/v1/auth/reset-password/${rawToken}`)
      .send({ password: "NewPassword123!", confirmPassword: "NewPassword123!" });

    expect(resetResponse.status).toBe(200);

    const afterReset = await prisma.user.findUniqueOrThrow({ where: { id: createdUser.id } });
    expect(afterReset.resetPasswordToken).toBeNull();
    expect(afterReset.resetPasswordExpires).toBeNull();

    const passwordMatches = await bcrypt.compare("NewPassword123!", afterReset.password);
    expect(passwordMatches).toBe(true);

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
  });
});
