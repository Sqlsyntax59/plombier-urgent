import { describe, it, expect } from 'vitest'
import {
  checkUrgency,
  generateFieldSummary,
  leadStep1Schema,
  leadStep2Schema,
  leadStep3Schema,
  leadSubmitSchema,
  type GuidedAnswers,
} from '@/lib/validations/lead'

describe('checkUrgency', () => {
  it('retourne urgent si fuite continue = true', () => {
    const answers: GuidedAnswers = { continuous: true }
    const result = checkUrgency('fuite', answers)
    expect(result.isUrgent).toBe(true)
    expect(result.reason).toBe('Fuite continue non maîtrisée')
  })

  it('retourne non urgent si fuite continue = false', () => {
    const answers: GuidedAnswers = { continuous: false }
    const result = checkUrgency('fuite', answers)
    expect(result.isUrgent).toBe(false)
    expect(result.reason).toBeNull()
  })

  it('retourne urgent si WC déborde (overflow = true)', () => {
    const answers: GuidedAnswers = { overflow: true }
    const result = checkUrgency('wc_bouche', answers)
    expect(result.isUrgent).toBe(true)
    expect(result.reason).toBe('WC qui déborde')
  })

  it('retourne urgent si fuite sur ballon eau chaude', () => {
    const answers: GuidedAnswers = { leak: true }
    const result = checkUrgency('ballon_eau_chaude', answers)
    expect(result.isUrgent).toBe(true)
    expect(result.reason).toBe('Fuite sur ballon d\'eau chaude')
  })

  it('retourne urgent si canalisation totalement bloquée', () => {
    const answers: GuidedAnswers = { total_block: true }
    const result = checkUrgency('canalisation', answers)
    expect(result.isUrgent).toBe(true)
    expect(result.reason).toBe('Canalisation totalement bouchée')
  })

  it('retourne urgent si client indique urgence ressentie', () => {
    const answers: GuidedAnswers = { urgent_feeling: true }
    const result = checkUrgency('autre', answers)
    expect(result.isUrgent).toBe(true)
    expect(result.reason).toBe('Urgence signalée par le client')
  })

  it('retourne non urgent pour type de problème inconnu', () => {
    const answers: GuidedAnswers = { some_field: true }
    const result = checkUrgency('unknown_type', answers)
    expect(result.isUrgent).toBe(false)
    expect(result.reason).toBeNull()
  })

  it('retourne non urgent si aucune réponse urgente', () => {
    const answers: GuidedAnswers = { location: 'Sous évier/lavabo', shutoff: true }
    const result = checkUrgency('fuite', answers)
    expect(result.isUrgent).toBe(false)
  })
})

describe('generateFieldSummary', () => {
  it('génère une synthèse avec le label du type de problème', () => {
    const answers: GuidedAnswers = {}
    const result = generateFieldSummary('fuite', answers, '')
    expect(result).toContain('📍 Fuite d\'eau')
  })

  it('inclut les réponses boolean avec Oui/Non', () => {
    const answers: GuidedAnswers = { continuous: true, shutoff: false }
    const result = generateFieldSummary('fuite', answers, '')
    expect(result).toContain('✓ Oui')
    expect(result).toContain('✗ Non')
  })

  it('inclut les réponses select', () => {
    const answers: GuidedAnswers = { location: 'Sous évier/lavabo' }
    const result = generateFieldSummary('fuite', answers, '')
    expect(result).toContain('Sous évier/lavabo')
  })

  it('inclut la description du client si fournie', () => {
    const answers: GuidedAnswers = {}
    const description = 'Fuite importante sous le lavabo'
    const result = generateFieldSummary('fuite', answers, description)
    expect(result).toContain('💬 "Fuite importante sous le lavabo"')
  })

  it('gère un type de problème inconnu', () => {
    const answers: GuidedAnswers = {}
    const result = generateFieldSummary('unknown', answers, 'Test')
    expect(result).toContain('📍 unknown')
  })

  it('ignore les valeurs vides', () => {
    const answers: GuidedAnswers = { location: '', shutoff: undefined as unknown as boolean }
    const result = generateFieldSummary('fuite', answers, '')
    expect(result).not.toContain('location')
  })
})

describe('leadStep1Schema', () => {
  it('accepte un type de problème valide', () => {
    const result = leadStep1Schema.safeParse({ problemType: 'fuite' })
    expect(result.success).toBe(true)
  })

  it('rejette un type de problème invalide', () => {
    const result = leadStep1Schema.safeParse({ problemType: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepte tous les types valides', () => {
    const types = ['fuite', 'wc_bouche', 'ballon_eau_chaude', 'canalisation', 'robinetterie', 'autre']
    types.forEach(type => {
      const result = leadStep1Schema.safeParse({ problemType: type })
      expect(result.success).toBe(true)
    })
  })
})

describe('leadStep2Schema', () => {
  it('accepte une description valide', () => {
    const result = leadStep2Schema.safeParse({
      description: 'Fuite sous le lavabo depuis ce matin',
    })
    expect(result.success).toBe(true)
  })

  it('rejette une description trop courte (< 10 chars)', () => {
    const result = leadStep2Schema.safeParse({ description: 'Fuite' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('10 caracteres')
    }
  })

  it('rejette une description trop longue (> 500 chars)', () => {
    const result = leadStep2Schema.safeParse({ description: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepte une URL de photo valide', () => {
    const result = leadStep2Schema.safeParse({
      description: 'Fuite sous le lavabo',
      photoUrl: 'https://example.com/photo.jpg',
    })
    expect(result.success).toBe(true)
  })

  it('accepte une URL de photo vide', () => {
    const result = leadStep2Schema.safeParse({
      description: 'Fuite sous le lavabo',
      photoUrl: '',
    })
    expect(result.success).toBe(true)
  })
})

describe('leadStep3Schema - téléphone', () => {
  it('accepte un numéro mobile français 06', () => {
    const result = leadStep3Schema.safeParse({ clientPhone: '06 12 34 56 78' })
    expect(result.success).toBe(true)
  })

  it('accepte un numéro mobile français 07', () => {
    const result = leadStep3Schema.safeParse({ clientPhone: '07 12 34 56 78' })
    expect(result.success).toBe(true)
  })

  it('accepte un numéro avec format +33', () => {
    const result = leadStep3Schema.safeParse({ clientPhone: '+33 6 12 34 56 78' })
    expect(result.success).toBe(true)
  })

  it('accepte un numéro avec tirets', () => {
    const result = leadStep3Schema.safeParse({ clientPhone: '06-12-34-56-78' })
    expect(result.success).toBe(true)
  })

  it('rejette un numéro fixe (01)', () => {
    const result = leadStep3Schema.safeParse({ clientPhone: '01 23 45 67 89' })
    expect(result.success).toBe(false)
  })

  it('rejette un numéro incomplet', () => {
    const result = leadStep3Schema.safeParse({ clientPhone: '06 12 34' })
    expect(result.success).toBe(false)
  })
})

describe('leadStep3Schema - email', () => {
  it('accepte un email valide', () => {
    const result = leadStep3Schema.safeParse({
      clientPhone: '06 12 34 56 78',
      clientEmail: 'test@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('accepte un email vide (optionnel)', () => {
    const result = leadStep3Schema.safeParse({
      clientPhone: '06 12 34 56 78',
      clientEmail: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un email invalide', () => {
    const result = leadStep3Schema.safeParse({
      clientPhone: '06 12 34 56 78',
      clientEmail: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })
})

describe('leadSubmitSchema', () => {
  it('accepte un formulaire complet valide', () => {
    const result = leadSubmitSchema.safeParse({
      problemType: 'fuite',
      description: 'Fuite sous le lavabo depuis ce matin',
      clientPhone: '06 12 34 56 78',
      clientEmail: 'test@example.com',
      clientCity: 'Paris',
    })
    expect(result.success).toBe(true)
  })

  it('accepte un formulaire avec champs optionnels vides', () => {
    const result = leadSubmitSchema.safeParse({
      problemType: 'fuite',
      description: 'Fuite sous le lavabo',
      clientPhone: '06 12 34 56 78',
    })
    expect(result.success).toBe(true)
  })

  it('rejette si champ obligatoire manquant', () => {
    const result = leadSubmitSchema.safeParse({
      problemType: 'fuite',
      description: 'Fuite sous le lavabo',
      // clientPhone manquant
    })
    expect(result.success).toBe(false)
  })
})
