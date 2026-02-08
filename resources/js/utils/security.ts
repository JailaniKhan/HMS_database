/**
 * Security utilities for sanitizing and validating user input
 * Prevents XSS attacks and ensures data integrity
 */

// Basic HTML sanitization - removes potentially dangerous tags and attributes
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove on* event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '')
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, '')
  sanitized = sanitized.replace(/on\w+=[^\s>]+/gi, '')
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href=["']javascript:[^"']*["']/gi, '')
  sanitized = sanitized.replace(/src=["']javascript:[^"']*["']/gi, '')
  
  // Remove data: URLs that could contain malicious content
  sanitized = sanitized.replace(/src=["']data:(?!image\/)[^"']*["']/gi, '')
  
  // Remove iframe tags (potential security risk)
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // Remove object/embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '')
  
  return sanitized
}

// More restrictive sanitization for user-generated content
export function sanitizeUserContent(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  // Allow only basic formatting tags
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'p']
  const tagPattern = new RegExp(`<\\/?(${allowedTags.join('|')})\\b[^>]*>`, 'gi')
  
  // First remove all tags
  let sanitized = content.replace(/<[^>]*>/g, '')
  
  // Then selectively restore allowed tags
  sanitized = content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // Restore allowed tags
  allowedTags.forEach(tag => {
    sanitized = sanitized.replace(
      new RegExp(`&lt;${tag}(&gt;|\\s[^&]*&gt;)`, 'gi'),
      `<${tag}$1`
    )
    sanitized = sanitized.replace(
      new RegExp(`&lt;/${tag}&gt;`, 'gi'),
      `</${tag}>`
    )
  })
  
  return sanitized
}

// Validate and sanitize URLs
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''
  
  try {
    const parsedUrl = new URL(url, window.location.origin)
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return ''
    }
    
    // Prevent javascript protocol
    if (parsedUrl.protocol === 'javascript:') {
      return ''
    }
    
    return parsedUrl.toString()
  } catch {
    return ''
  }
}

// Validate email addresses
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Validate phone numbers (international format)
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  
  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)\+\.]/g, '')
  
  // Check if it contains only digits and is reasonable length
  const phoneRegex = /^\d{7,15}$/
  return phoneRegex.test(cleanPhone)
}

// Validate numeric inputs
export function validateNumber(value: unknown, min?: number, max?: number): boolean {
  if (value === null || value === undefined) return false
  
  const num = Number(value)
  if (isNaN(num)) return false
  
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false
  
  return true
}

// Escape HTML entities to prevent XSS
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  
  return text.replace(/[&<>"'\/]/g, (char) => map[char])
}

// Create safe HTML content component
export interface SafeHtmlProps {
  html: string
  className?: string
  tagName?: keyof JSX.IntrinsicElements
}

export function SafeHtml({ html, className, tagName = 'div' }: SafeHtmlProps): JSX.Element {
  const sanitizedHtml = sanitizeHtml(html)
  const Tag = tagName
  
  return <Tag 
    className={className}
    dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
  />
}

// Validate and sanitize form data
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data }
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key]
    
    if (typeof value === 'string') {
      // Trim whitespace
      let cleanValue = value.trim()
      
      // Sanitize based on field type (you can customize this)
      if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
        cleanValue = sanitizeUserContent(cleanValue)
      } else {
        cleanValue = escapeHtml(cleanValue)
      }
      
      sanitized[key] = cleanValue as any
    }
  })
  
  return sanitized
}

// Rate limiting for user inputs to prevent abuse
export class InputRateLimiter {
  private timestamps: Map<string, number[]> = new Map()
  private readonly windowMs: number
  private readonly maxAttempts: number

  constructor(windowMs: number = 60000, maxAttempts: number = 10) {
    this.windowMs = windowMs
    this.maxAttempts = maxAttempts
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const timestamps = this.timestamps.get(identifier) || []
    
    // Remove old timestamps
    const recentTimestamps = timestamps.filter(time => now - time < this.windowMs)
    
    if (recentTimestamps.length >= this.maxAttempts) {
      return false
    }
    
    // Add current timestamp
    recentTimestamps.push(now)
    this.timestamps.set(identifier, recentTimestamps)
    
    return true
  }

  reset(identifier: string): void {
    this.timestamps.delete(identifier)
  }
}

// Export validation schemas for common use cases
export const ValidationSchemas = {
  email: (value: string) => validateEmail(value),
  phone: (value: string) => validatePhone(value),
  url: (value: string) => Boolean(sanitizeUrl(value)),
  required: (value: unknown) => value !== null && value !== undefined && value !== '',
  minLength: (min: number) => (value: string) => typeof value === 'string' && value.length >= min,
  maxLength: (max: number) => (value: string) => typeof value === 'string' && value.length <= max,
  number: (min?: number, max?: number) => (value: unknown) => validateNumber(value, min, max)
}