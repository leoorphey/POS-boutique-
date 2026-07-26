import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  expiresInToDate,
} from "@/utils/tokens";
import { env } from "@/config/env";
import { emailService } from "@/services/email.service";
import { LoginInput } from "@pos/shared";

async function issueTokenPair(userId: string, email: string, role: "ADMIN" | "VENDEUR") {
  const accessToken = signAccessToken({ sub: userId, email, role });
  const refreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId,
      expiresAt: expiresInToDate(env.jwt.refreshExpiresIn),
    },
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !user.isActive) {
      // Generic message to avoid account enumeration
      throw AppError.unauthorized("Email ou mot de passe incorrect");
    }

    // Vérifier verrouillage de compte
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.warn(`Compte ${user.email} verrouillé jusqu'à ${user.lockedUntil.toISOString()}`);
      // Ne pas révéler au client la raison exacte
      throw AppError.unauthorized("Email ou mot de passe incorrect");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      // Incrémente le compteur d'échecs et verrouille si nécessaire
      try {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const data: any = { failedLoginAttempts: attempts };
        if (attempts >= 5) {
          const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          data.lockedUntil = lockedUntil;
          console.warn(`Verrouillage du compte ${user.email} jusqu'à ${lockedUntil.toISOString()}`);
        }
        await prisma.user.update({ where: { id: user.id }, data });
      } catch (err) {
        console.error('Erreur lors de l\'incrément des tentatives de login :', err);
      }
      throw AppError.unauthorized("Email ou mot de passe incorrect");
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    const tokens = await issueTokenPair(user.id, user.email, user.role);

    // Optional: if password is old (>90 days), force password change flow
    if (user.passwordChangedAt) {
      const ageMs = Date.now() - user.passwordChangedAt.getTime();
      const days = ageMs / (1000 * 60 * 60 * 24);
      if (days > 90) {
        throw AppError.forbidden('Mot de passe expiré, veuillez le changer');
      }
    }

    return {
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  },

  async refresh(refreshTokenRaw: string) {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshTokenRaw);
    } catch {
      throw AppError.unauthorized("Refresh token invalide ou expiré");
    }

    const tokenHash = hashToken(refreshTokenRaw);
    const stored = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!stored) {
      // Le token est structurellement valide (signature JWT ok) mais absent de la DB :
      // soit déjà utilisé/révoqué, soit jamais émis par nous. Dans le doute, on
      // révoque toutes les sessions actives de l'utilisateur (signal de vol possible).
      await prisma.refreshToken.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw AppError.unauthorized(
        "Session invalide. Toutes les sessions ont été révoquées par sécurité, veuillez vous reconnecter."
      );
    }

    if (stored.revokedAt || stored.expiresAt < new Date()) {
      throw AppError.unauthorized("Refresh token expiré ou révoqué");
    }

    if (!stored.user.isActive) {
      throw AppError.unauthorized("Compte désactivé");
    }

    // Rotation : on révoque l'ancien token immédiatement et on en émet un nouveau.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await issueTokenPair(stored.user.id, stored.user.email, stored.user.role);

    return {
      user: {
        id: stored.user.id,
        nom: stored.user.nom,
        email: stored.user.email,
        role: stored.user.role,
      },
      ...tokens,
    };
  },

  async logout(refreshTokenRaw: string) {
    const tokenHash = hashToken(refreshTokenRaw);
    await prisma.refreshToken.updateMany({
      where: { token: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: "ADMIN",
        isActive: true,
      },
    });

    const genericMessage =
      "Si un compte administrateur est associé à cette adresse email, un lien de réinitialisation a été envoyé.";

    if (!user) {
      return { message: genericMessage };
    }

    const now = new Date();
    if (user.resetPasswordRequestedAt && now.getTime() - user.resetPasswordRequestedAt.getTime() < 60_000) {
      return { message: genericMessage };
    }

    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashToken(rawToken),
        resetPasswordExpires: expiresAt,
        resetPasswordRequestedAt: now,
        resetPasswordUsedAt: null,
      },
    });

    await emailService.sendPasswordResetEmail({
      name: user.nom,
      email: user.email,
      resetUrl: `${env.frontendUrl}/admin/reset-password/${rawToken}`,
    });

    return { message: genericMessage };
  },

  async resetPassword(token: string, password: string) {
    if (!token) {
      throw AppError.badRequest("Token requis");
    }

    const hashedToken = hashToken(token);
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
      },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date() || !user.isActive) {
      throw AppError.badRequest("Lien de réinitialisation invalide ou expiré");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          resetPasswordRequestedAt: null,
          resetPasswordUsedAt: new Date(),
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: "Mot de passe modifié avec succès" };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("Utilisateur introuvable");
    return {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
    };
  },
};
