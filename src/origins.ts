/**
 * Centralized CORS Origins Configuration
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR ALL ALLOWED ORIGINS ⚠️
 * 
 * This file is the ONLY place where allowed origins should be configured.
 * All services import from here via @remix-endpoints/shared/config
 * 
 * DO NOT hardcode origins in:
 * - Service middleware files
 * - CORS configuration
 * - Origin validation logic
 * 
 * To add/remove origins, modify the arrays below or set AUTH_ALLOWED_ORIGINS env var.
 */

// Production domains
const PRODUCTION_ORIGINS = [
  'https://remix.ethereum.org',
  'https://alpha.remix.live',
  'https://beta.remix.live',
  'https://remix-alpha.ethereum.org',
  'https://remix-beta.ethereum.org',
]

// Development domains
const DEVELOPMENT_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5173',  // Admin app
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
]

// Ngrok domains (for testing)
const NGROK_ORIGINS = [
  'https://remix-dev.ngrok.dev',
  'https://admin-remix-dev.ngrok.dev',
  'https://api-remix-dev.ngrok.dev',
]

/**
 * Get all allowed origins
 * Can be overridden by AUTH_ALLOWED_ORIGINS environment variable
 */
export function getAllowedOrigins(): string[] {
  // Check for environment variable override
  if (process.env.AUTH_ALLOWED_ORIGINS) {
    return process.env.AUTH_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  }

  // Return all known origins
  return [
    ...PRODUCTION_ORIGINS,
    ...DEVELOPMENT_ORIGINS,
    ...NGROK_ORIGINS,
  ]
}

/**
 * Check if an origin matches a pattern with wildcards
 * Supports patterns like: deploy-preview*.netlify.app
 */
function matchesPattern(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return origin === pattern
  }
  
  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars except *
    .replace(/\*/g, '.*') // Replace * with .*
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(origin)
}

/**
 * Create CORS middleware configuration
 * Use this in all services for consistent CORS handling
 */
export function createCorsConfig() {
  const allowedOrigins = getAllowedOrigins()

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true)
      }

      // Check against allowed origins (including wildcard patterns)
      const isAllowed = allowedOrigins.some(pattern => matchesPattern(origin, pattern)) || allowedOrigins.includes('*')
      
      if (isAllowed) {
        callback(null, true)
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`)
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  }
}

/**
 * Check if an origin is allowed (for manual checks)
 */
export function isOriginAllowed(origin: string): boolean {
  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*')
}