import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifySiret } from '@/lib/services/sirene'

describe('verifySiret', () => {
  beforeEach(() => {
    vi.stubEnv('INSEE_SIRENE_TOKEN', 'test-token')
  })

  it('retourne verified: true pour un SIRET valide et actif', async () => {
    const mockResponse = {
      etablissement: {
        siret: '12345678901234',
        uniteLegale: {
          denominationUniteLegale: 'ENTREPRISE TEST',
          nomUniteLegale: null,
          prenomUsuelUniteLegale: null,
        },
        periodesEtablissement: [{ etatAdministratifEtablissement: 'A' }],
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(true)
    expect(result.degraded).toBe(false)
    expect(result.companyName).toBe('ENTREPRISE TEST')
    expect(result.error).toBeNull()
  })

  it('retourne verified: false pour un SIRET inexistant (404)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    const result = await verifySiret('00000000000000')

    expect(result.verified).toBe(false)
    expect(result.degraded).toBe(false)
    expect(result.error).toContain("n'existe pas")
  })

  it('retourne verified: false pour une entreprise fermée', async () => {
    const mockResponse = {
      etablissement: {
        siret: '12345678901234',
        uniteLegale: {
          denominationUniteLegale: 'ENTREPRISE FERMEE',
          nomUniteLegale: null,
          prenomUsuelUniteLegale: null,
        },
        periodesEtablissement: [{ etatAdministratifEtablissement: 'F' }],
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(false)
    expect(result.degraded).toBe(false)
    expect(result.error).toContain("n'est plus en activité")
  })

  it('retourne degraded: true en cas de rate limit (429)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response)

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(false)
    expect(result.degraded).toBe(true)
    expect(result.error).toBeNull()
  })

  it('retourne degraded: true en cas de timeout', async () => {
    const abortError = new Error('Aborted')
    abortError.name = 'AbortError'
    vi.mocked(fetch).mockRejectedValueOnce(abortError)

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(false)
    expect(result.degraded).toBe(true)
    expect(result.error).toBeNull()
  })

  it('retourne degraded: true si token manquant', async () => {
    vi.stubEnv('INSEE_SIRENE_TOKEN', '')

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(false)
    expect(result.degraded).toBe(true)
    expect(result.error).toBeNull()
  })

  it('retourne degraded: true en cas d\'erreur serveur (500)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(false)
    expect(result.degraded).toBe(true)
  })

  it('retourne degraded: true en cas d\'erreur auth (401)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response)

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(false)
    expect(result.degraded).toBe(true)
  })

  it('extrait le nom depuis prenom + nom si pas de denomination', async () => {
    const mockResponse = {
      etablissement: {
        siret: '12345678901234',
        uniteLegale: {
          denominationUniteLegale: null,
          nomUniteLegale: 'DUPONT',
          prenomUsuelUniteLegale: 'JEAN',
        },
        periodesEtablissement: [{ etatAdministratifEtablissement: 'A' }],
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await verifySiret('12345678901234')

    expect(result.verified).toBe(true)
    expect(result.companyName).toBe('JEAN DUPONT')
  })

  it('appelle l\'API avec les bons headers', async () => {
    vi.stubEnv('INSEE_SIRENE_TOKEN', 'my-test-token')

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    await verifySiret('12345678901234')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.insee.fr/api-sirene/3.11/siret/12345678901234',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-INSEE-Api-Key-Integration': 'my-test-token',
          'Accept': 'application/json',
        }),
      })
    )
  })
})
