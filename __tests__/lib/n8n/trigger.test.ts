import { describe, it, expect, vi, beforeEach } from 'vitest'

// Note: Les fonctions de trigger.ts lisent N8N_WEBHOOK_URL au niveau du module,
// ce qui rend le stubEnv inefficace après l'import. On teste donc uniquement
// les cas où le webhook est configuré (via setup.ts qui définit la variable).

describe('triggerLeadWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('retourne success si webhook répond 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    // Import dynamique pour avoir un module frais
    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Fuite sous lavabo',
    })

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('retourne error si webhook ET fallback échouent', async () => {
    // Webhook n8n échoue (500)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    } as Response)
    // Fallback assign aussi échoue
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    } as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Fuite sous lavabo',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('500')
  })

  it('retourne error en cas d\'exception réseau', async () => {
    // Les deux fetch rejettent (webhook + fallback)
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Fuite sous lavabo',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('envoie leadId et appUrl au webhook', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      clientCity: 'Paris',
      problemType: 'fuite',
      description: 'Fuite sous lavabo',
      fieldSummary: '📍 Fuite d\'eau',
      isUrgent: true,
      urgencyReason: 'Fuite continue',
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('webhook'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(callArgs[1]?.body as string)

    expect(body.leadId).toBe('lead-123')
    expect(body.appUrl).toBeDefined()
  })

  it('utilise le fallback si webhook échoue et retourne success', async () => {
    // Webhook échoue
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)
    // Fallback assign réussit
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, assignmentId: 'assign-1' }),
    } as unknown as Response)
    // WhatsApp notification (fire and forget)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
    } as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Fuite',
    })

    expect(result.success).toBe(true)
  })

  it('envoie le leadId au fallback assign', async () => {
    // Webhook échoue
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)
    // Fallback assign réussit
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    } as unknown as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Ma description',
    })

    // Le 2e appel fetch est le fallback
    const callArgs = vi.mocked(fetch).mock.calls[1]
    const body = JSON.parse(callArgs[1]?.body as string)

    expect(body.leadId).toBe('lead-123')
    expect(body.mode).toBe('first')
  })

  it('retourne success même si pas d\'artisan disponible dans le fallback', async () => {
    // Webhook échoue
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)
    // Fallback assign réussit mais pas d'artisan
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    } as unknown as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Fuite',
    })

    expect(result.success).toBe(true)
  })
})

describe('triggerFollowUpWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('envoie l\'événement followup_j3', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    const { triggerFollowUpWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerFollowUpWorkflow('lead-123')

    expect(result.success).toBe(true)

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(callArgs[1]?.body as string)

    expect(body.event).toBe('lead.followup_j3')
    expect(body.leadId).toBe('lead-123')
    expect(body.timestamp).toBeDefined()
  })

  it('retourne error si webhook échoue', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response)

    const { triggerFollowUpWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerFollowUpWorkflow('lead-123')

    expect(result.success).toBe(false)
    expect(result.error).toContain('503')
  })

  it('gère les erreurs réseau', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection refused'))

    const { triggerFollowUpWorkflow } = await import('@/lib/n8n/trigger')

    const result = await triggerFollowUpWorkflow('lead-123')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Connection refused')
  })
})
