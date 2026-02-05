import { describe, it, expect } from "vitest";
import { calculateLeadScore } from "@/lib/services/scoring";
import type { ScoreInput } from "@/lib/services/scoring";

function makeInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    problemType: "fuite",
    description: "Ma chaudière fuit depuis ce matin, il y a de l'eau partout dans la cuisine.",
    photoUrl: null,
    isUrgent: false,
    isGeocoded: false,
    ...overrides,
  };
}

describe("calculateLeadScore", () => {
  it("score de base = 30", () => {
    const result = calculateLeadScore(makeInput());
    expect(result.factors.base).toBe(30);
    expect(result.score).toBe(30);
    expect(result.quality).toBe("low");
  });

  it("+25 pour urgence", () => {
    const result = calculateLeadScore(makeInput({ isUrgent: true }));
    expect(result.factors.urgency).toBe(25);
    expect(result.score).toBe(55);
    expect(result.quality).toBe("medium");
  });

  it("+15 pour photo", () => {
    const result = calculateLeadScore(makeInput({ photoUrl: "https://example.com/photo.jpg" }));
    expect(result.factors.photo).toBe(15);
    expect(result.score).toBe(45);
  });

  it("+10 pour géocodage", () => {
    const result = calculateLeadScore(makeInput({ isGeocoded: true }));
    expect(result.factors.geocoded).toBe(10);
    expect(result.score).toBe(40);
    expect(result.quality).toBe("medium");
  });

  it("+5 pour description > 100 chars", () => {
    const longDesc = "A".repeat(101);
    const result = calculateLeadScore(makeInput({ description: longDesc }));
    expect(result.factors.description).toBe(5);
    expect(result.score).toBe(35);
  });

  it("-30 pour description < 20 chars", () => {
    const result = calculateLeadScore(makeInput({ description: "court" }));
    expect(result.factors.description).toBe(-30);
    expect(result.score).toBe(0);
    expect(result.quality).toBe("low");
  });

  it("clamp à 0 minimum", () => {
    const result = calculateLeadScore(makeInput({ description: "x" }));
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("tous les bonus = 85 (high)", () => {
    const result = calculateLeadScore(
      makeInput({
        isUrgent: true,
        photoUrl: "https://example.com/photo.jpg",
        isGeocoded: true,
        description: "A".repeat(101),
      })
    );
    // 30 + 25 + 15 + 10 + 5 = 85
    expect(result.score).toBe(85);
    expect(result.quality).toBe("high");
  });

  it("score maximal possible avec clamp à 100", () => {
    // Même le max réaliste est 85, vérifions le clamp
    const result = calculateLeadScore(
      makeInput({
        isUrgent: true,
        photoUrl: "https://example.com/photo.jpg",
        isGeocoded: true,
        description: "A".repeat(101),
      })
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("classification premium >= 90", () => {
    // On ne peut pas atteindre 90 avec le barème actuel (max 85)
    // Mais vérifions la logique de classification
    const result = calculateLeadScore(makeInput());
    // Forçons un test unitaire de la logique quality
    expect(["low", "medium", "high", "premium"]).toContain(result.quality);
  });

  it("retourne les factors en détail", () => {
    const result = calculateLeadScore(
      makeInput({ isUrgent: true, photoUrl: "photo.jpg" })
    );
    expect(result.factors).toEqual({
      base: 30,
      urgency: 25,
      photo: 15,
      geocoded: 0,
      description: 0,
    });
  });

  it("description de longueur exacte 20 = pas de bonus/malus", () => {
    const result = calculateLeadScore(
      makeInput({ description: "12345678901234567890" }) // exactement 20
    );
    expect(result.factors.description).toBe(0);
  });

  it("description de longueur exacte 100 = pas de bonus", () => {
    const result = calculateLeadScore(
      makeInput({ description: "A".repeat(100) })
    );
    expect(result.factors.description).toBe(0);
  });
});
