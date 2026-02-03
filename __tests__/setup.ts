import { vi, beforeEach, afterEach } from 'vitest'

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')
vi.stubEnv('INSEE_SIRENE_TOKEN', 'test-insee-token')
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-32-characters-min')
vi.stubEnv('N8N_WEBHOOK_URL', 'https://n8n.test/webhook')
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

// Mock global fetch
const originalFetch = global.fetch
beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  global.fetch = originalFetch
  vi.clearAllMocks()
})

// Mock console to reduce noise in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
