import { describe, it, expect, vi, beforeEach } from "vitest";
import { geocodePostalCode, recordLeadEvent } from "@/lib/services/geocoding";

// Mock supabase
const mockSingle = vi.fn();
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockInsert = vi.fn().mockResolvedValue({ error: null });

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === "geocode_cache") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gt: vi.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
        upsert: mockUpsert,
      };
    }
    if (table === "lead_events") {
      return { insert: mockInsert };
    }
    return {};
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => mockSupabase,
}));

// Mock fetch via vi.stubGlobal
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  // Re-stub fetch après clearAllMocks
  vi.stubGlobal("fetch", mockFetch);
});

describe("geocodePostalCode", () => {
  it("retourne erreur pour un code postal invalide", async () => {
    const result = await geocodePostalCode("123");
    expect(result.success).toBe(false);
    expect(result.source).toBe("none");
    expect(result.error).toContain("invalide");
  });

  it("retourne erreur pour un code postal vide", async () => {
    const result = await geocodePostalCode("");
    expect(result.success).toBe(false);
    expect(result.source).toBe("none");
  });

  it("retourne le cache si disponible", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { latitude: 48.8566, longitude: 2.3522, city_name: "Paris" },
      error: null,
    });

    const result = await geocodePostalCode("75001");
    expect(result.success).toBe(true);
    expect(result.source).toBe("cache");
    expect(result.latitude).toBe(48.8566);
    expect(result.longitude).toBe(2.3522);
    expect(result.cityName).toBe("Paris");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("appelle API BAN si pas de cache", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          features: [
            {
              geometry: { coordinates: [2.3522, 48.8566] },
              properties: { city: "Paris" },
            },
          ],
        }),
    });

    const result = await geocodePostalCode("75001");
    expect(result.success).toBe(true);
    expect(result.source).toBe("api_ban");
    expect(result.latitude).toBe(48.8566);
    expect(result.longitude).toBe(2.3522);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("retourne fallback si API BAN échoue", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await geocodePostalCode("75001");
    expect(result.success).toBe(false);
    expect(result.source).toBe("none");
    expect(result.error).toContain("500");
  });

  it("retourne fallback si features vide", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ features: [] }),
    });

    const result = await geocodePostalCode("99999");
    expect(result.success).toBe(false);
    expect(result.error).toContain("non trouvé");
  });

  it("gère le timeout fetch", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    mockFetch.mockRejectedValueOnce(new Error("The operation was aborted"));

    const result = await geocodePostalCode("75001");
    expect(result.success).toBe(false);
    expect(result.source).toBe("none");
  });
});

describe("recordLeadEvent", () => {
  it("insère un événement dans lead_events", async () => {
    await recordLeadEvent("lead-123", "lead_scored", { score: 85 });
    expect(mockInsert).toHaveBeenCalledWith({
      lead_id: "lead-123",
      event_type: "lead_scored",
      payload: { score: 85 },
    });
  });
});
