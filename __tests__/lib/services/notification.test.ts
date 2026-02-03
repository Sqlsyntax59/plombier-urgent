import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  prepareWhatsAppNotification,
  prepareSMSNotification,
  prepareEmailNotification,
} from '@/lib/services/notification'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockAssignmentData = {
  id: 'assignment-123',
  lead_id: 'lead-456',
  artisan_id: 'artisan-789',
  leads: {
    problem_type: 'fuite' as const,
    description: 'Fuite sous le lavabo de la cuisine',
    photo_url: 'https://example.com/photo.jpg',
    client_city: 'Paris',
  },
  profiles: {
    first_name: 'Jean',
    whatsapp_phone: '06 12 34 56 78',
    phone: '06 98 76 54 32',
  },
}

describe('prepareWhatsAppNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne les données WhatsApp formatées pour un assignment trouvé', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareWhatsAppNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message).toBeDefined()
    expect(result.message!.to).toBe('06 12 34 56 78')
    expect(result.message!.templateName).toBe('lead_notification')
    expect(result.message!.templateLanguage).toBe('fr')
    expect(result.message!.raw.artisanFirstName).toBe('Jean')
    expect(result.message!.raw.problemTypeLabel).toBe("Fuite d'eau")
    expect(result.message!.raw.city).toBe('Paris')
    expect(result.message!.raw.acceptUrl).toContain('assignment-123')
  })

  it('retourne error si assignment non trouvé', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareWhatsAppNotification('unknown', 'https://app.example.com')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Assignment non trouvé')
  })

  it('retourne error si artisan sans numéro WhatsApp ni téléphone', async () => {
    const dataNoPhone = {
      ...mockAssignmentData,
      profiles: {
        first_name: 'Jean',
        whatsapp_phone: null,
        phone: null,
      },
    }
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: dataNoPhone, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareWhatsAppNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Artisan sans numéro WhatsApp')
  })

  it('utilise le téléphone standard si pas de WhatsApp', async () => {
    const dataNoWhatsapp = {
      ...mockAssignmentData,
      profiles: {
        first_name: 'Jean',
        whatsapp_phone: null,
        phone: '06 98 76 54 32',
      },
    }
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: dataNoWhatsapp, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareWhatsAppNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message!.to).toBe('06 98 76 54 32')
  })

  it('tronque la description à 100 caractères', async () => {
    const longDescription = 'A'.repeat(150)
    const dataLongDesc = {
      ...mockAssignmentData,
      leads: {
        ...mockAssignmentData.leads,
        description: longDescription,
      },
    }
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: dataLongDesc, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareWhatsAppNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message!.components[0].parameters[3].text.length).toBe(100)
    expect(result.message!.components[0].parameters[3].text.endsWith('...')).toBe(true)
  })

  it('utilise "Non précisé" si pas de ville', async () => {
    const dataNoCity = {
      ...mockAssignmentData,
      leads: {
        ...mockAssignmentData.leads,
        client_city: null,
      },
    }
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: dataNoCity, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareWhatsAppNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message!.raw.city).toBe('Non précisé')
  })
})

describe('prepareSMSNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne un message SMS formaté', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareSMSNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message).toBeDefined()
    expect(result.message!.to).toBe('06 98 76 54 32')
    expect(result.message!.body).toContain("Fuite d'eau")
    expect(result.message!.body).toContain('Paris')
    expect(result.message!.acceptUrl).toContain('assignment-123')
  })

  it('retourne error si artisan sans téléphone', async () => {
    const dataNoPhone = {
      ...mockAssignmentData,
      profiles: { first_name: 'Jean', phone: null },
    }
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: dataNoPhone, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareSMSNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Artisan sans numéro de téléphone')
  })

  it('omet la ville si non précisée', async () => {
    const dataNoCity = {
      ...mockAssignmentData,
      leads: { ...mockAssignmentData.leads, client_city: null },
    }
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: dataNoCity, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareSMSNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message!.body).not.toContain(' à ')
  })
})

describe('prepareEmailNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne un email HTML formaté', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: 'jean@example.com' } },
          }),
        },
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareEmailNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message).toBeDefined()
    expect(result.message!.to).toBe('jean@example.com')
    expect(result.message!.subject).toContain("Fuite d'eau")
    expect(result.message!.html).toContain('Bonjour Jean')
    expect(result.message!.html).toContain('Paris')
    expect(result.message!.html).toContain('Fuite sous le lavabo')
    expect(result.message!.html).toContain('https://example.com/photo.jpg')
    expect(result.message!.acceptUrl).toContain('assignment-123')
  })

  it('retourne error si artisan sans email', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAssignmentData, error: null }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: null } },
          }),
        },
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareEmailNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Artisan sans email')
  })

  it('gère l\'absence de photo dans le HTML', async () => {
    const dataNoPhoto = {
      ...mockAssignmentData,
      leads: { ...mockAssignmentData.leads, photo_url: null },
    }
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: dataNoPhoto, error: null }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: 'jean@example.com' } },
          }),
        },
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await prepareEmailNotification('assignment-123', 'https://app.example.com')

    expect(result.success).toBe(true)
    expect(result.message!.html).not.toContain('Voir la photo')
  })
})
