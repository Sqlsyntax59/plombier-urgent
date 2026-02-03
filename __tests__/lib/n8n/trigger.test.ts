import { describe, it, expect, vi, beforeEach } from 'vitest'

// Note: Les fonctions de trigger.ts lisent N8N_WEBHOOK_URL au niveau du module,
// ce qui rend le stubEnv inefficace après l'import. On teste donc uniquement
// les cas où le webhook est configuré (via setup.ts qui définit la variable).

describe('triggerLeadWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('retourne error si webhook répond 500', async () => {
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
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

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

  it('envoie les données correctement formatées', async () => {
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
    expect(body.phone).toBe('0612345678')
    expect(body.address).toBe('Paris')
    expect(body.urgencyType).toBe('fuite')
    expect(body.description).toBe('Fuite sous lavabo')
    expect(body.fieldSummary).toBe('📍 Fuite d\'eau')
    expect(body.isUrgent).toBe(true)
    expect(body.urgencyReason).toBe('Fuite continue')
    expect(body.timestamp).toBeDefined()
  })

  it('utilise "Non précisée" si pas de ville', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Fuite',
      // Pas de clientCity
    })

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(callArgs[1]?.body as string)

    expect(body.address).toBe('Non précisée')
  })

  it('utilise description comme fieldSummary par défaut', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Ma description',
      // Pas de fieldSummary
    })

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(callArgs[1]?.body as string)

    expect(body.fieldSummary).toBe('Ma description')
  })

  it('utilise isUrgent false par défaut', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    const { triggerLeadWorkflow } = await import('@/lib/n8n/trigger')

    await triggerLeadWorkflow({
      leadId: 'lead-123',
      clientPhone: '0612345678',
      problemType: 'fuite',
      description: 'Fuite',
    })

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(callArgs[1]?.body as string)

    expect(body.isUrgent).toBe(false)
    expect(body.urgencyReason).toBeNull()
  })
})

describe('triggerFollowUpWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
