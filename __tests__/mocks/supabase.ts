import { vi } from 'vitest'

// Mock Supabase query builder
export function createMockQueryBuilder(data: unknown = null, error: Error | null = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
  // For chained calls that end without single()
  builder.select.mockImplementation(() => {
    return { ...builder, then: (resolve: (v: { data: unknown; error: Error | null }) => void) => resolve({ data, error }) }
  })
  return builder
}

// Mock Supabase client
export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  return {
    from: vi.fn(() => createMockQueryBuilder()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
    ...overrides,
  }
}

// Mock for @/lib/supabase/server
export const mockCreateClient = vi.fn(() => Promise.resolve(createMockSupabaseClient()))
