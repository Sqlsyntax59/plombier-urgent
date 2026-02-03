import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies BEFORE importing the module
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  updateInsurance,
  getVerificationStatus,
} from '@/lib/actions/verification'

const validInsuranceData = {
  insuranceProvider: 'AXA Assurance',
  insurancePolicyNumber: 'POL-123456789',
  insuranceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 an
}

describe('updateInsurance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si validation échoue (provider trop court)', async () => {
    const result = await updateInsurance({
      ...validInsuranceData,
      insuranceProvider: 'A', // Trop court
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('2 caractères')
  })

  it('retourne erreur si validation échoue (date passée)', async () => {
    const result = await updateInsurance({
      ...validInsuranceData,
      insuranceValidUntil: '2020-01-01', // Dans le passé
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('futur')
  })

  it('retourne erreur si utilisateur non connecté', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateInsurance(validInsuranceData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('connecté')
  })

  it('retourne erreur si profil non trouvé', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateInsurance(validInsuranceData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('introuvable')
  })

  it('retourne erreur si compte déjà vérifié', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { verification_status: 'verified' },
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateInsurance(validInsuranceData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('déjà vérifié')
  })

  it('retourne erreur si compte suspendu', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { verification_status: 'suspended' },
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateInsurance(validInsuranceData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('suspendu')
  })

  it('met à jour le profil et passe en pending_verification', async () => {
    const updateMock = vi.fn().mockReturnThis()
    let callCount = 0
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // Premier appel : select verification_status
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { verification_status: 'registered' },
              error: null,
            }),
          }
        }
        // Deuxième appel : update
        return {
          update: updateMock,
          eq: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    }
    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateInsurance(validInsuranceData)

    expect(result.success).toBe(true)
    expect(result.message).toContain('Validation en cours')
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        insurance_provider: 'AXA Assurance',
        verification_status: 'pending_verification',
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/artisan/dashboard')
    expect(revalidatePath).toHaveBeenCalledWith('/artisan/verification')
  })

  it('retourne erreur si mise à jour échoue', async () => {
    let callCount = 0
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { verification_status: 'registered' },
              error: null,
            }),
          }
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateInsurance(validInsuranceData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('mise à jour')
  })

  it('accepte attestationPath optionnel', async () => {
    const updateMock = vi.fn().mockReturnThis()
    let callCount = 0
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { verification_status: 'registered' },
              error: null,
            }),
          }
        }
        return {
          update: updateMock,
          eq: vi.fn().mockResolvedValue({ error: null }),
        }
      }),
    }
    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await updateInsurance({
      ...validInsuranceData,
      insuranceAttestationPath: '/uploads/attestation.pdf',
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        insurance_attestation_path: '/uploads/attestation.pdf',
      })
    )
  })
})

describe('getVerificationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si non connecté', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getVerificationStatus()

    expect(result.status).toBeNull()
    expect(result.error).toContain('Non connecté')
  })

  it('retourne erreur si profil non trouvé', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getVerificationStatus()

    expect(result.status).toBeNull()
    expect(result.error).toContain('introuvable')
  })

  it('retourne le statut de vérification', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            verification_status: 'pending_verification',
            siret_verified: true,
            insurance_provider: 'AXA',
          },
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getVerificationStatus()

    expect(result.status).toBe('pending_verification')
    expect(result.siretVerified).toBe(true)
    expect(result.insuranceProvider).toBe('AXA')
    expect(result.error).toBeUndefined()
  })

  it('gère siret_verified null', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            verification_status: 'registered',
            siret_verified: null,
            insurance_provider: null,
          },
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getVerificationStatus()

    expect(result.siretVerified).toBe(false) // null → false
    expect(result.insuranceProvider).toBeNull()
  })
})
