import { describe, it, expect } from "vitest";
import { AppError } from "@/utils/AppError";

describe("AppError", () => {
  it("crée une erreur 400 par défaut", () => {
    const err = new AppError("Erreur de test");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Erreur de test");
    expect(err.isOperational).toBe(true);
  });

  it("notFound() renvoie un statusCode 404", () => {
    const err = AppError.notFound();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Ressource introuvable");
  });

  it("conflict() renvoie un statusCode 409 avec message personnalisé", () => {
    const err = AppError.conflict("Email déjà utilisé");
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe("Email déjà utilisé");
  });

  it("unauthorized() renvoie un statusCode 401", () => {
    expect(AppError.unauthorized().statusCode).toBe(401);
  });

  it("forbidden() renvoie un statusCode 403", () => {
    expect(AppError.forbidden().statusCode).toBe(403);
  });

  it("est une instance de Error (compatible avec le throw/catch standard)", () => {
    const err = AppError.badRequest("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
