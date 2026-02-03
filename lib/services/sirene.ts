/**
 * Service de vérification SIRET via API INSEE Sirene
 * Story 2.1 V2 - Anti-travail dissimulé
 *
 * Endpoint: GET https://api.insee.fr/api-sirene/3.11/siret/{siret}
 * Auth: X-INSEE-Api-Key-Integration header
 */

export interface SireneResult {
  verified: boolean;
  degraded: boolean;
  companyName: string | null;
  error: string | null;
}

interface SireneEtablissement {
  siret: string;
  uniteLegale: {
    denominationUniteLegale: string | null;
    nomUniteLegale: string | null;
    prenomUsuelUniteLegale: string | null;
  };
  periodesEtablissement: Array<{
    etatAdministratifEtablissement: "A" | "F"; // A = Actif, F = Fermé
  }>;
}

interface SireneResponse {
  etablissement: SireneEtablissement;
}

const SIRENE_API_URL = "https://api.insee.fr/api-sirene/3.11/siret";
const TIMEOUT_MS = 10000;

/**
 * Vérifie un SIRET via l'API INSEE Sirene
 *
 * Comportements:
 * - SIRET valide et actif → verified: true, companyName rempli
 * - SIRET inexistant → verified: false, error message
 * - Entreprise fermée → verified: false, error message
 * - API down/timeout/rate limit → degraded: true (pas de blocage)
 */
export async function verifySiret(siret: string): Promise<SireneResult> {
  const token = process.env.INSEE_SIRENE_TOKEN;

  // Mode dégradé si pas de token configuré
  if (!token) {
    console.warn("[Sirene] INSEE_SIRENE_TOKEN not configured - degraded mode");
    return {
      verified: false,
      degraded: true,
      companyName: null,
      error: null,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${SIRENE_API_URL}/${siret}`, {
      method: "GET",
      headers: {
        "X-INSEE-Api-Key-Integration": token,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // SIRET inexistant
    if (response.status === 404) {
      return {
        verified: false,
        degraded: false,
        companyName: null,
        error: "Ce SIRET n'existe pas dans la base Sirene",
      };
    }

    // Rate limit ou erreur serveur → mode dégradé
    if (response.status === 429 || response.status >= 500) {
      console.warn(`[Sirene] API error ${response.status} - degraded mode`);
      return {
        verified: false,
        degraded: true,
        companyName: null,
        error: null,
      };
    }

    // Erreur d'authentification
    if (response.status === 401 || response.status === 403) {
      console.error("[Sirene] Authentication error - check INSEE_SIRENE_TOKEN");
      return {
        verified: false,
        degraded: true,
        companyName: null,
        error: null,
      };
    }

    // Autre erreur
    if (!response.ok) {
      console.error(`[Sirene] Unexpected error ${response.status}`);
      return {
        verified: false,
        degraded: true,
        companyName: null,
        error: null,
      };
    }

    // Succès - parser la réponse
    const data: SireneResponse = await response.json();
    const etablissement = data.etablissement;

    // Vérifier si l'entreprise est active
    const isActive =
      etablissement.periodesEtablissement?.[0]?.etatAdministratifEtablissement === "A";

    if (!isActive) {
      return {
        verified: false,
        degraded: false,
        companyName: null,
        error: "Cette entreprise n'est plus en activité",
      };
    }

    // Extraire le nom de l'entreprise
    const uniteLegale = etablissement.uniteLegale;
    const companyName =
      uniteLegale.denominationUniteLegale ||
      [uniteLegale.prenomUsuelUniteLegale, uniteLegale.nomUniteLegale]
        .filter(Boolean)
        .join(" ") ||
      null;

    return {
      verified: true,
      degraded: false,
      companyName,
      error: null,
    };
  } catch (error) {
    // Timeout ou erreur réseau → mode dégradé
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.warn("[Sirene] Request timeout - degraded mode");
      } else {
        console.error("[Sirene] Network error:", error.message);
      }
    }

    return {
      verified: false,
      degraded: true,
      companyName: null,
      error: null,
    };
  }
}
