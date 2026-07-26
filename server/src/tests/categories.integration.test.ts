import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// Mock du client Prisma : on isole le test de toute vraie base de données.
// Pour un test d'intégration plus poussé (avec une vraie DB de test Postgres),
// voir la note dans README.md section "Tests".
vi.mock("@/config/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/config/prisma";
import { createApp } from "@/app";
import { env } from "@/config/env";

const app = createApp();

function makeAdminToken() {
  return jwt.sign(
    { sub: "admin-id", email: "admin@boutique.com", role: "ADMIN" },
    env.jwt.accessSecret,
    { expiresIn: "15m" }
  );
}

describe("GET /api/v1/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejette une requête sans token (401)", async () => {
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("renvoie la liste des catégories pour un utilisateur authentifié", async () => {
    const mockCategories = [
      { id: "cat-1", nom: "Téléphones", description: null, _count: { products: 3 } },
    ];
    (prisma.category.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);

    const token = makeAdminToken();
    const res = await request(app)
      .get("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockCategories);
  });
});

describe("POST /api/v1/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejette un nom de catégorie trop court (validation Zod)", async () => {
    const token = makeAdminToken();
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ nom: "A" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("crée une catégorie valide", async () => {
    (prisma.category.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.category.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "cat-new",
      nom: "Imprimantes",
      description: null,
    });

    const token = makeAdminToken();
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ nom: "Imprimantes" });

    expect(res.status).toBe(201);
    expect(res.body.data.nom).toBe("Imprimantes");
  });

  it("rejette la création par un vendeur (RBAC)", async () => {
    const vendeurToken = jwt.sign(
      { sub: "vendeur-id", email: "vendeur@boutique.com", role: "VENDEUR" },
      env.jwt.accessSecret,
      { expiresIn: "15m" }
    );

    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${vendeurToken}`)
      .send({ nom: "Test" });

    expect(res.status).toBe(403);
  });
});
