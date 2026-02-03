import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies BEFORE importing the module
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  updateWhatsAppConfig,
  getCurrentProfile,
  getPublicProfile,
  updateProfile,
} from '@/lib/actions/profile'

describe('updateWhatsAppConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si validation échoue (numéro fixe)', async () => {
    const result = await updateWhatsAppConfig({
      whatsappPhone: '01 23 45 67 89', // Fixe, pas mobile
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('mobile')
  })

  it('retourne erreur si numéro invalide', async () => {
    const result = await updateWhatsAppConfig({
      whatsappPhone: '123',
    })

    expect(result.success).toBe(false)
  })

  it('retourne erreur si utilisateur non connecté', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateWhatsAppConfig({
      whatsappPhone: '06 12 34 56 78',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('connecte')
  })

  it('normalise le numéro et met à jour le profil', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        update: updateMock,
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await updateWhatsAppConfig({
      whatsappPhone: '06 12 34 56 78',
    })

    expect(updateMock).toHaveBeenCalledWith({
      whatsapp_phone: '0612345678', // Normalisé
    })
    expect(redirect).toHaveBeenCalledWith('/artisan/dashboard')
  })

  it('retourne erreur si mise à jour échoue', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateWhatsAppConfig({
      whatsappPhone: '06 12 34 56 78',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('sauvegarde')
  })
})

describe('getCurrentProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne null si utilisateur non connecté', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getCurrentProfile()

    expect(result).toBeNull()
  })

  it('retourne le profil si utilisateur connecté', async () => {
    const mockProfile = {
      id: 'user-123',
      first_name: 'Jean',
      last_name: 'Dupont',
      city: 'Paris',
    }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getCurrentProfile()

    expect(result).toEqual(mockProfile)
  })
})

describe('getPublicProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne null si profil non trouvé', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getPublicProfile('unknown-slug')

    expect(result).toBeNull()
  })

  it('retourne le profil public avec métriques par défaut', async () => {
    const mockProfile = {
      first_name: 'Jean',
      city: 'Paris',
      trade: 'plombier',
      radius_km: 25,
      google_business_url: 'https://g.page/jean-plombier',
      average_rating: 4.5,
      total_reviews: 12,
    }
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getPublicProfile('jean-paris-abc1')

    expect(result).toEqual({
      ...mockProfile,
      is_reactive: true, // Placeholder
      response_time_avg: null,
    })
  })

  it('gère les ratings null', async () => {
    const mockProfile = {
      first_name: 'Jean',
      city: 'Paris',
      trade: 'plombier',
      radius_km: 25,
      google_business_url: null,
      average_rating: null,
      total_reviews: null,
    }
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getPublicProfile('jean-paris-abc1')

    expect(result?.average_rating).toBeNull()
    expect(result?.total_reviews).toBe(0)
  })
})

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si validation échoue', async () => {
    const result = await updateProfile({
      firstName: 'J', // Trop court
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 25,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('2 caracteres')
  })

  it('retourne erreur si rayon hors limites', async () => {
    const result = await updateProfile({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 150, // > 100
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('100 km')
  })

  it('retourne erreur si utilisateur non connecté', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await updateProfile({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 25,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('connecte')
  })

  it('génère un slug si pas existant', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { slug: null }, error: null }),
        update: updateMock,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    // Override pour update
    mockSupabase.from = vi.fn().mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { slug: null }, error: null }),
          update: updateMock,
        }
      }
      return {}
    })
    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const result = await updateProfile({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 25,
    })

    expect(result.success).toBe(true)
    // Vérifie qu'un slug a été généré (format jean-paris-xxxx)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: expect.stringMatching(/^jean-paris-[a-z0-9]{4}$/),
      })
    )
  })

  it('conserve le slug existant', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { slug: 'existing-slug-1234' }, error: null }),
        update: updateMock,
      })),
    }
    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await updateProfile({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 25,
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'existing-slug-1234', // Conservé
      })
    )
  })

  it('normalise les numéros de téléphone', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { slug: 'test' }, error: null }),
        update: updateMock,
      })),
    }
    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await updateProfile({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      whatsappPhone: '07 98 76 54 32',
      city: 'Paris',
      radiusKm: 25,
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '0612345678',
        whatsapp_phone: '0798765432',
      })
    )
  })

  it('gère googleBusinessUrl vide', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { slug: 'test' }, error: null }),
        update: updateMock,
      })),
    }
    updateMock.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await updateProfile({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 25,
      googleBusinessUrl: '',
    })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        google_business_url: null,
      })
    )
  })
})
