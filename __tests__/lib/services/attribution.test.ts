import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  findBestArtisan,
  getNextArtisanInCascade,
  expirePendingAssignments,
} from '@/lib/services/attribution'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockArtisan = {
  id: 'artisan-123',
  first_name: 'Jean',
  phone: '06 12 34 56 78',
  whatsapp_phone: '06 12 34 56 78',
  city: 'Paris',
  credits: 10,
}

describe('findBestArtisan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne un artisan avec crédits et crée un assignment', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = {
      from: mockFrom,
    }

    // Mock pour existing assignments (premier appel)
    const existingAssignmentsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    // Mock pour la recherche artisan (deuxième appel)
    const artisanQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [mockArtisan], error: null }),
    }

    // Mock pour création assignment (troisième appel)
    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'assignment-new' }, error: null }),
    }

    // Mock pour update lead (quatrième appel)
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(existingAssignmentsQuery) // lead_assignments select
      .mockReturnValueOnce(artisanQuery) // profiles select
      .mockReturnValueOnce(insertQuery) // lead_assignments insert
      .mockReturnValueOnce(updateQuery) // leads update

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await findBestArtisan({
      leadId: 'lead-123',
      verticalId: 'vertical-plombier',
      cascadePosition: 1,
    })

    expect(result.success).toBe(true)
    expect(result.artisan).toBeDefined()
    expect(result.artisan!.id).toBe('artisan-123')
    expect(result.artisan!.firstName).toBe('Jean')
    expect(result.artisan!.credits).toBe(10)
    expect(result.assignmentId).toBe('assignment-new')
  })

  it('retourne noArtisanAvailable si aucun artisan disponible', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    const existingAssignmentsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const artisanQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    mockFrom
      .mockReturnValueOnce(existingAssignmentsQuery)
      .mockReturnValueOnce(artisanQuery)

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await findBestArtisan({
      leadId: 'lead-123',
      verticalId: 'vertical-plombier',
      cascadePosition: 1,
    })

    expect(result.success).toBe(false)
    expect(result.noArtisanAvailable).toBe(true)
    expect(result.error).toBe('Aucun artisan disponible')
  })

  it('exclut les artisans déjà notifiés pour ce lead', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    // Simule 2 artisans déjà notifiés
    const existingAssignmentsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ artisan_id: 'artisan-1' }, { artisan_id: 'artisan-2' }],
        error: null,
      }),
    }

    const notMock = vi.fn().mockReturnThis()
    const artisanQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      not: notMock,
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [mockArtisan], error: null }),
    }

    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'assignment-new' }, error: null }),
    }

    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(existingAssignmentsQuery)
      .mockReturnValueOnce(artisanQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(updateQuery)

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await findBestArtisan({
      leadId: 'lead-123',
      verticalId: 'vertical-plombier',
      cascadePosition: 1,
    })

    // Vérifie que not() a été appelé avec les IDs exclus
    expect(notMock).toHaveBeenCalledWith('id', 'in', '(artisan-1,artisan-2)')
  })

  it('filtre par verticalId si fourni', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    const existingAssignmentsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const eqMock = vi.fn().mockReturnThis()
    const artisanQuery = {
      select: vi.fn().mockReturnThis(),
      eq: eqMock,
      gt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    mockFrom
      .mockReturnValueOnce(existingAssignmentsQuery)
      .mockReturnValueOnce(artisanQuery)

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await findBestArtisan({
      leadId: 'lead-123',
      verticalId: 'vertical-plombier',
      cascadePosition: 1,
    })

    // Vérifie que eq() a été appelé avec vertical_id
    expect(eqMock).toHaveBeenCalledWith('vertical_id', 'vertical-plombier')
  })

  it('retourne une erreur si la création d\'assignment échoue', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    const existingAssignmentsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }

    const artisanQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [mockArtisan], error: null }),
    }

    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }

    mockFrom
      .mockReturnValueOnce(existingAssignmentsQuery)
      .mockReturnValueOnce(artisanQuery)
      .mockReturnValueOnce(insertQuery)

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await findBestArtisan({
      leadId: 'lead-123',
      verticalId: null,
      cascadePosition: 1,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Erreur création attribution')
  })
})

describe('getNextArtisanInCascade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si lead non trouvé', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getNextArtisanInCascade('lead-unknown')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Lead non trouvé')
  })

  it('retourne erreur si lead déjà traité (pas pending)', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { status: 'accepted', cascade_count: 1, vertical_id: null },
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getNextArtisanInCascade('lead-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Lead déjà traité')
  })

  it('marque le lead unassigned si cascade > 4', async () => {
    const mockFrom = vi.fn()
    const updateMock = vi.fn().mockReturnThis()
    const mockSupabase = { from: mockFrom }

    // Premier appel: select lead
    const selectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { status: 'pending', cascade_count: 4, vertical_id: null },
        error: null,
      }),
    }

    // Deuxième appel: update lead status
    const updateQuery = {
      update: updateMock,
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(selectQuery)
      .mockReturnValueOnce(updateQuery)

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await getNextArtisanInCascade('lead-123')

    expect(result.success).toBe(false)
    expect(result.noArtisanAvailable).toBe(true)
    expect(result.error).toBe('Cascade terminée')
    expect(updateMock).toHaveBeenCalledWith({ status: 'unassigned' })
  })
})

describe('expirePendingAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne le nombre d\'assignments expirés', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'assign-1', lead_id: 'lead-1' },
            { id: 'assign-2', lead_id: 'lead-2' },
          ],
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await expirePendingAssignments()

    expect(result.expired).toBe(2)
    expect(result.error).toBeUndefined()
  })

  it('retourne 0 si aucun assignment à expirer', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await expirePendingAssignments()

    expect(result.expired).toBe(0)
  })

  it('retourne erreur en cas de problème DB', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await expirePendingAssignments()

    expect(result.expired).toBe(0)
    expect(result.error).toBe('Erreur expiration')
  })
})
