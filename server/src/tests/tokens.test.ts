import { describe, it, expect } from "vitest";
import { hashToken, expiresInToDate } from "@/utils/tokens";

describe("hashToken", () => {
  it("produit toujours le même hash pour la même entrée", () => {
    const token = "exemple-de-refresh-token";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produit des hash différents pour des entrées différentes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("ne renvoie jamais le token en clair", () => {
    const token = "secret-refresh-token-123";
    expect(hashToken(token)).not.toContain(token);
  });
});

describe("expiresInToDate", () => {
  it("calcule correctement une durée en minutes", () => {
    const before = Date.now();
    const result = expiresInToDate("15m");
    const diffMs = result.getTime() - before;
    // Tolérance de quelques ms pour le temps d'exécution du test.
    expect(diffMs).toBeGreaterThan(15 * 60 * 1000 - 1000);
    expect(diffMs).toBeLessThan(15 * 60 * 1000 + 1000);
  });

  it("calcule correctement une durée en jours", () => {
    const before = Date.now();
    const result = expiresInToDate("7d");
    const diffMs = result.getTime() - before;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(diffMs).toBeGreaterThan(sevenDaysMs - 1000);
    expect(diffMs).toBeLessThan(sevenDaysMs + 1000);
  });

  it("rejette un format de durée invalide", () => {
    expect(() => expiresInToDate("invalide")).toThrow();
  });
});
