// Security utilities and configurations for Supabase
import { supabase } from './supabase'

// Rate limiting - simple client-side implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private limits = {
    search: { max: 10, window: 60000 }, // 10 requests per minute
    download: { max: 20, window: 300000 }, // 20 downloads per 5 minutes
    general: { max: 100, window: 60000 } // 100 requests per minute
  }

  canMakeRequest(action: keyof typeof this.limits, clientId?: string): boolean {
    const id = clientId || 'anonymous'
    const limit = this.limits[action]
    const key = `${action}_${id}`
    
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Eski istekleri temizle
    const validRequests = requests.filter(time => now - time < limit.window)
    
    if (validRequests.length >= limit.max) {
      return false
    }
    
    // Yeni isteği ekle
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    return true
  }
}

export const rateLimiter = new RateLimiter()

// API anahtarı doğrulama
export function validateSupabaseConnection(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (!url || !key || url.includes('YOUR_') || key.includes('YOUR_')) {
    console.error('❌ Supabase credentials not configured properly')
    return false
  }
  
  return true
}

// Güvenli dosya indirme
export async function secureDownload(fileUrl: string, bookId: string, format: string) {
  // Rate limiting kontrolü
  if (!rateLimiter.canMakeRequest('download')) {
    throw new Error('Too many download requests. Please wait and try again.')
  }
  
  try {
    // Download log'u kaydet
    const { error } = await supabase
      .from('download_logs')
      .insert({
        book_id: bookId,
        format,
        downloaded_at: new Date().toISOString(),
        user_ip: 'client_side', // Client-side'da IP alamayız
      })
    
    if (error) {
      console.warn('⚠️ Could not log download:', error)
      // Hata olsa bile download'a devam et
    }
    
    // Dosyayı indir
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
  const isDevelopment = import.meta.env.DEV
  const isProduction = import.meta.env.PROD
  
  if (isProduction && !validateSupabaseConnection()) {
    console.error('❌ Production environment with invalid Supabase config!')
    return false
  }
  
  if (isDevelopment) {
    console.log('🚧 Development mode - security warnings disabled')
  }
  
  return true
}
