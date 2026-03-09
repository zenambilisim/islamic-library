// Security utilities – Supabase artık sadece sunucuda (lib/supabase-server)

// Rate limiting - simple client-side implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private limits = {
    search: { max: 10, window: 60000 },
    download: { max: 20, window: 300000 },
    general: { max: 100, window: 60000 }
  }

  canMakeRequest(action: keyof typeof this.limits, clientId?: string): boolean {
    const id = clientId || 'anonymous'
    const limit = this.limits[action]
    const key = `${action}_${id}`
    const now = Date.now()
    const requests = this.requests.get(key) || []
    const validRequests = requests.filter(time => now - time < limit.window)
    if (validRequests.length >= limit.max) return false
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

export const rateLimiter = new RateLimiter()

/** Sunucuda SUPABASE_* env kontrolü; client'ta her zaman true (API üzerinden gider). */
export function validateSupabaseConnection(): boolean {
  if (typeof window !== 'undefined') return true
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && !String(url).includes('YOUR_') && !String(key).includes('YOUR_'))
}

/** İndirmeyi API ile loglar, sonra dosyayı açar. */
export async function secureDownload(fileUrl: string, bookId: string, format: string) {
  if (!rateLimiter.canMakeRequest('download')) {
    throw new Error('Too many download requests. Please wait and try again.')
  }
  try {
    await fetch('/api/download-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, format }),
    }).catch(() => {})
    window.open(fileUrl, '_blank')
  } catch (error) {
    console.error('❌ Download error:', error)
    throw error
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"'&]/g, '') // XSS koruması
    .substring(0, 200) // Uzunluk sınırı
    .trim()
}

// Search query validation
export function validateSearchQuery(query: string): boolean {
  if (!query || query.length < 2) return false
  if (query.length > 200) return false
  
  // Tehlikeli karakterleri kontrol et
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(query))
}

// Environment check
export function checkEnvironment() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction && !validateSupabaseConnection()) {
    console.error('❌ Production environment with invalid Supabase config!')
    return false
  }
  
  if (isDevelopment) {
    console.log('🚧 Development mode - security warnings disabled')
  }
  
  return true
}
