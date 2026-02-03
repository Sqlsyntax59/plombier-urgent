import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies BEFORE importing the module
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/sirene', () => ({
  verifySiret: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { verifySiret } from '@/lib/services/sirene'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import {
  signUpArtisan,
  loginWithPassword,
  sendMagicLink,
  signOut,
} from '@/lib/actions/auth'

const validArtisanData = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean@example.com',
  password: 'Password123',
  phone: '06 12 34 56 78',
  city: 'Paris',
  trade: 'plombier' as const,
  siret: '12345678901234',
  specializations: ['depannage', 'fuite'],
  acceptCgv: true,
}

describe('signUpArtisan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si validation échoue (email invalide)', async () => {
    const result = await signUpArtisan({
      ...validArtisanData,
      email: 'not-an-email',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('email')
  })

  it('retourne erreur si validation échoue (mot de passe faible)', async () => {
    const result = await signUpArtisan({
      ...validArtisanData,
      password: 'weak',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('8 caracteres')
  })

  it('retourne erreur si validation échoue (SIRET invalide)', async () => {
    const result = await signUpArtisan({
      ...validArtisanData,
      siret: '123', // Trop court
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('14 chiffres')
  })

  it('retourne erreur si validation échoue (CGV non acceptées)', async () => {
    const result = await signUpArtisan({
      ...validArtisanData,
      acceptCgv: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('CGV')
  })

  it('retourne erreur si email déjà utilisé', async () => {
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User already registered' },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await signUpArtisan(validArtisanData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('deja utilisee')
  })

  it('retourne erreur si création user échoue', async () => {
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await signUpArtisan(validArtisanData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('creation du compte')
  })

  it('crée le compte et redirige vers /artisan/whatsapp', async () => {
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(verifySiret).mockResolvedValue({
      verified: true,
      degraded: false,
      companyName: 'ENTREPRISE TEST',
      error: null,
    })

    await signUpArtisan(validArtisanData)

    expect(verifySiret).toHaveBeenCalledWith('12345678901234')
    expect(redirect).toHaveBeenCalledWith('/artisan/whatsapp')
  })

  it('continue même si SIRET en mode dégradé', async () => {
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(verifySiret).mockResolvedValue({
      verified: false,
      degraded: true,
      companyName: null,
      error: null,
    })

    await signUpArtisan(validArtisanData)

    // L'inscription continue malgré le mode dégradé
    expect(redirect).toHaveBeenCalledWith('/artisan/whatsapp')
  })
})

describe('loginWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si validation échoue', async () => {
    const result = await loginWithPassword({
      email: 'not-an-email',
      password: 'test',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('email')
  })

  it('retourne erreur si mot de passe vide', async () => {
    const result = await loginWithPassword({
      email: 'test@example.com',
      password: '',
    })

    expect(result.success).toBe(false)
  })

  it('retourne erreur si identifiants invalides', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid login credentials' },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const result = await loginWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('incorrect')
  })

  it('redirige vers admin dashboard si rôle admin', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await loginWithPassword({
      email: 'admin@example.com',
      password: 'Password123',
    })

    expect(redirect).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('redirige vers artisan dashboard si rôle artisan', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'artisan' },
          error: null,
        }),
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await loginWithPassword({
      email: 'artisan@example.com',
      password: 'Password123',
    })

    expect(redirect).toHaveBeenCalledWith('/artisan/dashboard')
  })
})

describe('sendMagicLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne erreur si email invalide', async () => {
    const result = await sendMagicLink({ email: 'invalid' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('email')
  })

  it('retourne erreur si envoi échoue', async () => {
    const mockSupabase = {
      auth: {
        signInWithOtp: vi.fn().mockResolvedValue({
          error: { message: 'Rate limit exceeded' },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue('localhost:3000'),
    } as never)

    const result = await sendMagicLink({ email: 'test@example.com' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Rate limit')
  })

  it('retourne success avec message si envoi réussi', async () => {
    const mockSupabase = {
      auth: {
        signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue('localhost:3000'),
    } as never)

    const result = await sendMagicLink({ email: 'test@example.com' })

    expect(result.success).toBe(true)
    expect(result.message).toContain('lien de connexion')
  })

  it('utilise https pour les hosts non-localhost', async () => {
    const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null })
    const mockSupabase = {
      auth: { signInWithOtp: mockSignInWithOtp },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn().mockReturnValue('app.plombier-urgent.fr'),
    } as never)

    await sendMagicLink({ email: 'test@example.com' })

    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('https://'),
        }),
      })
    )
  })
})

describe('signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('déconnecte et redirige vers /', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null })
    const mockSupabase = {
      auth: { signOut: mockSignOut },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    await signOut()

    expect(mockSignOut).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('/')
  })
})
