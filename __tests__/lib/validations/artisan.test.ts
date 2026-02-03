import { describe, it, expect } from 'vitest'
import {
  siretSchema,
  SIRET_REGEX,
  insuranceSchema,
  artisanSignUpSchema,
  profileUpdateSchema,
  whatsappConfigSchema,
  loginPasswordSchema,
} from '@/lib/validations/artisan'

describe('SIRET validation', () => {
  it('accepte un SIRET valide de 14 chiffres', () => {
    const result = siretSchema.safeParse('12345678901234')
    expect(result.success).toBe(true)
  })

  it('rejette un SIRET trop court (13 chiffres)', () => {
    const result = siretSchema.safeParse('1234567890123')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('14 chiffres')
    }
  })

  it('rejette un SIRET trop long (15 chiffres)', () => {
    const result = siretSchema.safeParse('123456789012345')
    expect(result.success).toBe(false)
  })

  it('rejette un SIRET avec des lettres', () => {
    const result = siretSchema.safeParse('1234567890123A')
    expect(result.success).toBe(false)
  })

  it('rejette un SIRET avec des espaces', () => {
    const result = siretSchema.safeParse('123 456 789 012')
    expect(result.success).toBe(false)
  })

  it('SIRET_REGEX matche correctement', () => {
    expect(SIRET_REGEX.test('12345678901234')).toBe(true)
    expect(SIRET_REGEX.test('1234567890123')).toBe(false)
    expect(SIRET_REGEX.test('123456789012345')).toBe(false)
    expect(SIRET_REGEX.test('abcdefghijklmn')).toBe(false)
  })
})

describe('Password validation', () => {
  it('accepte un mot de passe avec majuscule, minuscule et chiffre', () => {
    const result = artisanSignUpSchema.shape.password.safeParse('Password1')
    expect(result.success).toBe(true)
  })

  it('rejette un mot de passe sans majuscule', () => {
    const result = artisanSignUpSchema.shape.password.safeParse('password1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('majuscule')
    }
  })

  it('rejette un mot de passe sans minuscule', () => {
    const result = artisanSignUpSchema.shape.password.safeParse('PASSWORD1')
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe sans chiffre', () => {
    const result = artisanSignUpSchema.shape.password.safeParse('Password')
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe trop court (< 8 chars)', () => {
    const result = artisanSignUpSchema.shape.password.safeParse('Pass1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('8 caracteres')
    }
  })

  it('accepte un mot de passe complexe', () => {
    const result = artisanSignUpSchema.shape.password.safeParse('MonSuperMot2Passe!')
    expect(result.success).toBe(true)
  })
})

describe('Insurance date validation', () => {
  it('accepte une date dans le futur', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const result = insuranceSchema.safeParse({
      insuranceProvider: 'AXA Assurance',
      insurancePolicyNumber: 'POL123456',
      insuranceValidUntil: futureDate.toISOString().split('T')[0],
    })
    expect(result.success).toBe(true)
  })

  it('rejette une date dans le passé', () => {
    const pastDate = new Date()
    pastDate.setFullYear(pastDate.getFullYear() - 1)
    const result = insuranceSchema.safeParse({
      insuranceProvider: 'AXA Assurance',
      insurancePolicyNumber: 'POL123456',
      insuranceValidUntil: pastDate.toISOString().split('T')[0],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('futur')
    }
  })

  it('rejette une date invalide', () => {
    const result = insuranceSchema.safeParse({
      insuranceProvider: 'AXA',
      insurancePolicyNumber: 'POL123',
      insuranceValidUntil: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('Profile update constraints', () => {
  it('accepte une mise à jour de profil complète valide', () => {
    const result = profileUpdateSchema.safeParse({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 25,
    })
    expect(result.success).toBe(true)
  })

  it('rejette un rayon trop petit (< 1km)', () => {
    const result = profileUpdateSchema.safeParse({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 0,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('1 km')
    }
  })

  it('rejette un rayon trop grand (> 100km)', () => {
    const result = profileUpdateSchema.safeParse({
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      city: 'Paris',
      radiusKm: 150,
    })
    expect(result.success).toBe(false)
  })

  it('accepte un numéro WhatsApp mobile valide', () => {
    const result = whatsappConfigSchema.safeParse({
      whatsappPhone: '06 12 34 56 78',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un numéro fixe pour WhatsApp', () => {
    const result = whatsappConfigSchema.safeParse({
      whatsappPhone: '01 23 45 67 89',
    })
    expect(result.success).toBe(false)
  })
})

describe('artisanSignUpSchema complet', () => {
  const validArtisan = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    password: 'Password123',
    phone: '06 12 34 56 78',
    city: 'Paris',
    trade: 'plombier',
    siret: '12345678901234',
    specializations: ['depannage', 'fuite'],
    acceptCgv: true,
  }

  it('accepte un artisan valide', () => {
    const result = artisanSignUpSchema.safeParse(validArtisan)
    expect(result.success).toBe(true)
  })

  it('rejette si CGV non acceptées', () => {
    const result = artisanSignUpSchema.safeParse({
      ...validArtisan,
      acceptCgv: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('CGV')
    }
  })

  it('rejette si aucune spécialisation', () => {
    const result = artisanSignUpSchema.safeParse({
      ...validArtisan,
      specializations: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejette un email invalide', () => {
    const result = artisanSignUpSchema.safeParse({
      ...validArtisan,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginPasswordSchema', () => {
  it('accepte des identifiants valides', () => {
    const result = loginPasswordSchema.safeParse({
      email: 'test@example.com',
      password: 'mypassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = loginPasswordSchema.safeParse({
      email: 'invalid',
      password: 'mypassword',
    })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe vide', () => {
    const result = loginPasswordSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})
