import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLead } from '@/lib/actions/lead'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/n8n/trigger', () => ({
  triggerLeadWorkflow: vi.fn(),
}))

vi.mock('@/lib/services/geocoding', () => ({
  geocodePostalCode: vi.fn().mockResolvedValue({ success: false, source: 'none' }),
  recordLeadEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/services/scoring', () => ({
  calculateLeadScore: vi.fn().mockReturnValue({
    score: 30,
    quality: 'low',
    factors: { base: 30, urgency: 0, photo: 0, geocoded: 0, description: 0 },
  }),
}))

import { createAdminClient } from '@/lib/supabase/server'
import { triggerLeadWorkflow } from '@/lib/n8n/trigger'

const validLeadData = {
  problemType: 'fuite' as const,
  description: 'Fuite sous le lavabo de la cuisine depuis ce matin',
  clientPhone: '06 12 34 56 78',
  clientEmail: 'client@example.com',
  clientCity: 'Paris',
}

describe('createLead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crée un lead avec des données valides', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    // Mock vertical query
    const verticalQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'vertical-plombier' }, error: null }),
    }

    // Mock lead insert
    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'lead-new' }, error: null }),
    }

    // Mock lead update (notification status)
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(verticalQuery) // verticals
      .mockReturnValueOnce(insertQuery)   // leads insert
      .mockReturnValueOnce(updateQuery)   // leads update (scoring)
      .mockReturnValueOnce(updateQuery)   // leads update (notification status)

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never)
    vi.mocked(triggerLeadWorkflow).mockResolvedValue({ success: true })

    const result = await createLead(validLeadData)

    expect(result.success).toBe(true)
    expect(result.leadId).toBe('lead-new')
    expect(result.error).toBeUndefined()
  })

  it('retourne une erreur si validation échoue', async () => {
    const invalidData = {
      ...validLeadData,
      description: 'Court', // Trop court (< 10 chars)
    }

    const result = await createLead(invalidData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('10 caracteres')
  })

  it('retourne une erreur si téléphone invalide', async () => {
    const invalidData = {
      ...validLeadData,
      clientPhone: '01 23 45 67 89', // Fixe, pas mobile
    }

    const result = await createLead(invalidData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('mobile')
  })

  it('normalise le numéro de téléphone (supprime espaces)', async () => {
    const mockFrom = vi.fn()
    const insertMock = vi.fn().mockReturnThis()
    const mockSupabase = { from: mockFrom }

    const verticalQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'vertical-plombier' }, error: null }),
    }

    const insertQuery = {
      insert: insertMock,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'lead-new' }, error: null }),
    }

    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(verticalQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(updateQuery)   // scoring
      .mockReturnValueOnce(updateQuery)   // notification status

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never)
    vi.mocked(triggerLeadWorkflow).mockResolvedValue({ success: true })

    await createLead({
      ...validLeadData,
      clientPhone: '06 12 34 56 78',
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client_phone: '0612345678', // Sans espaces
      })
    )
  })

  it('retourne success même si workflow n8n échoue', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    const verticalQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'vertical-plombier' }, error: null }),
    }

    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'lead-new' }, error: null }),
    }

    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(verticalQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(updateQuery)   // scoring
      .mockReturnValueOnce(updateQuery)   // notification status

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never)
    vi.mocked(triggerLeadWorkflow).mockResolvedValue({ success: false, error: 'Webhook failed' })

    const result = await createLead(validLeadData)

    // Le lead est créé même si le workflow échoue
    expect(result.success).toBe(true)
    expect(result.leadId).toBe('lead-new')
  })

  it('retourne erreur si insertion en base échoue', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    const verticalQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'vertical-plombier' }, error: null }),
    }

    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }

    mockFrom
      .mockReturnValueOnce(verticalQuery)
      .mockReturnValueOnce(insertQuery)

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never)

    const result = await createLead(validLeadData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Erreur lors de la soumission')
  })

  it('inclut fieldSummary et urgency dans le workflow', async () => {
    const mockFrom = vi.fn()
    const mockSupabase = { from: mockFrom }

    const verticalQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'vertical-plombier' }, error: null }),
    }

    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'lead-new' }, error: null }),
    }

    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(verticalQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(updateQuery)   // scoring
      .mockReturnValueOnce(updateQuery)   // notification status

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never)
    vi.mocked(triggerLeadWorkflow).mockResolvedValue({ success: true })

    await createLead({
      ...validLeadData,
      guidedAnswers: { continuous: true }, // Fuite continue = urgent
    })

    expect(triggerLeadWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'lead-new',
        isUrgent: true,
        urgencyReason: 'Fuite continue non maîtrisée',
        fieldSummary: expect.stringContaining('Fuite'),
      })
    )
  })

  it('gère les champs optionnels vides', async () => {
    const mockFrom = vi.fn()
    const insertMock = vi.fn().mockReturnThis()
    const mockSupabase = { from: mockFrom }

    const verticalQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'vertical-plombier' }, error: null }),
    }

    const insertQuery = {
      insert: insertMock,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'lead-new' }, error: null }),
    }

    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom
      .mockReturnValueOnce(verticalQuery)
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(updateQuery)   // scoring
      .mockReturnValueOnce(updateQuery)   // notification status

    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as never)
    vi.mocked(triggerLeadWorkflow).mockResolvedValue({ success: true })

    await createLead({
      problemType: 'fuite',
      description: 'Fuite sous le lavabo',
      clientPhone: '06 12 34 56 78',
      // Pas d'email ni de ville
    })

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client_email: null,
        client_city: null,
      })
    )
  })
})
