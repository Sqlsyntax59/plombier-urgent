import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateAcceptToken,
  verifyAcceptToken,
  generateAcceptUrl,
} from '@/lib/actions/assignment'

// Note: Les tests d'acceptLead nécessitent un mock complexe du module serveur
// avec la directive "use server". Ces tests sont mieux adaptés à des tests
// d'intégration avec une vraie base de données ou via des tests E2E.

describe('generateAcceptToken et verifyAcceptToken', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret-at-least-32-characters')
  })

  it('génère un token JWT valide et le vérifie', async () => {
    const token = await generateAcceptToken('assignment-123', 'artisan-456')

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // Format JWT

    const result = await verifyAcceptToken(token)

    expect(result.valid).toBe(true)
    expect(result.assignmentId).toBe('assignment-123')
    expect(result.artisanId).toBe('artisan-456')
    expect(result.error).toBeUndefined()
  })

  it('rejette un token invalide', async () => {
    const result = await verifyAcceptToken('invalid-token')

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Token invalid or expired')
  })

  it('rejette un token altéré', async () => {
    const token = await generateAcceptToken('assignment-123', 'artisan-456')
    const alteredToken = token.slice(0, -5) + 'xxxxx' // Altère la signature

    const result = await verifyAcceptToken(alteredToken)

    expect(result.valid).toBe(false)
  })

  it('génère des tokens différents pour chaque appel', async () => {
    const token1 = await generateAcceptToken('assignment-1', 'artisan-1')
    const token2 = await generateAcceptToken('assignment-2', 'artisan-2')

    expect(token1).not.toBe(token2)
  })

  it('extrait correctement les données du token', async () => {
    const token = await generateAcceptToken('my-assignment-id', 'my-artisan-id')
    const result = await verifyAcceptToken(token)

    expect(result.valid).toBe(true)
    expect(result.assignmentId).toBe('my-assignment-id')
    expect(result.artisanId).toBe('my-artisan-id')
  })
})

describe('generateAcceptUrl', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret-at-least-32-characters')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.plombier-urgent.fr')
  })

  it('génère une URL complète avec token', async () => {
    const url = await generateAcceptUrl('assignment-123', 'artisan-456')

    expect(url).toContain('https://app.plombier-urgent.fr')
    expect(url).toContain('/api/lead/accept?token=')
    expect(url.split('token=')[1]).toBeDefined()
  })

  it('utilise baseUrl fourni en paramètre', async () => {
    const url = await generateAcceptUrl('assignment-123', 'artisan-456', 'https://custom.url')

    expect(url).toContain('https://custom.url')
  })

  it('utilise localhost par défaut si pas de config', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')

    const url = await generateAcceptUrl('assignment-123', 'artisan-456')

    expect(url).toContain('http://localhost:3000')
  })

  it('inclut un token JWT valide dans l\'URL', async () => {
    const url = await generateAcceptUrl('assignment-123', 'artisan-456')
    const token = url.split('token=')[1]

    // Vérifie que le token est valide
    const result = await verifyAcceptToken(token)
    expect(result.valid).toBe(true)
    expect(result.assignmentId).toBe('assignment-123')
    expect(result.artisanId).toBe('artisan-456')
  })
})
