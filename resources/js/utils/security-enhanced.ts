/**
 * Security enhancement utilities
 * Provides additional security measures and input validation
 */

import { logger } from '@/services/logger';
import { sanitizeHtml, sanitizeUrl, validateEmail, validatePhone } from '@/utils/security';

// Rate limiting class for preventing abuse
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    
    // Remove old timestamps
    const recent = timestamps.filter(time => now - time < this.windowMs);
    
    if (recent.length >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { identifier, requestCount: recent.length });
      return false;
    }
    
    // Add current timestamp
    recent.push(now);
    this.requests.set(identifier, recent);
    
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Input validation utilities
export const InputValidator = {
  // Validate and sanitize user input
  validateInput: (value: string, type: 'text' | 'email' | 'phone' | 'url' | 'html'): string => {
    if (!value || typeof value !== 'string') return '';
    
    switch (type) {
      case 'email':
        return validateEmail(value) ? value.trim() : '';
      case 'phone':
        return validatePhone(value) ? value.replace(/[\s\-()+.]/g, '') : '';
      case 'url':
        return sanitizeUrl(value);
      case 'html':
        return sanitizeHtml(value);
      case 'text':
      default:
        // Basic sanitization for text input
        return value
          .trim()
          .replace(/[<>]/g, '') // Remove basic HTML tags
          .substring(0, 1000); // Limit length
    }
  },

  // Validate form data
  validateFormData: <T extends Record<string, unknown>>(data: T): T => {
    const validated = { ...data };
    
    Object.keys(validated).forEach(key => {
      const value = validated[key];
      
      if (typeof value === 'string') {
        // Determine field type by name convention
        let fieldType: 'text' | 'email' | 'phone' | 'url' | 'html' = 'text';
        
        if (key.toLowerCase().includes('email')) fieldType = 'email';
        if (key.toLowerCase().includes('phone')) fieldType = 'phone';
        if (key.toLowerCase().includes('url')) fieldType = 'url';
        if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) fieldType = 'html';
        
        (validated as Record<string, unknown>)[key] = InputValidator.validateInput(value, fieldType);
      }
    });
    
    return validated;
  },

  // Check for suspicious patterns
  isSuspiciousInput: (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:/i,
      /vbscript:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /\b(ALTER|CREATE|DELETE|DROP|EXEC|INSERT|SELECT|UPDATE)\b/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(value));
  }
};

// CSRF protection utilities
export const CsrfProtection = {
  // Generate CSRF token
  generateToken: (): string => {
    return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
  },

  // Validate CSRF token
  validateToken: (token: string): boolean => {
    // In a real implementation, this would check against server-stored tokens
    return typeof token === 'string' && token.length > 10;
  }
};

// Session security utilities
export const SessionSecurity = {
  // Check for session hijacking attempts
  detectSessionAnomaly: (
    currentIp: string, 
    currentUserAgent: string,
    previousIp?: string,
    previousUserAgent?: string
  ): boolean => {
    // Simple anomaly detection - in production, use more sophisticated methods
    if (previousIp && currentIp !== previousIp) {
      logger.warn('Potential session hijacking detected - IP changed', {
        previousIp,
        currentIp
      });
      return true;
    }
    
    if (previousUserAgent && currentUserAgent !== previousUserAgent) {
      logger.warn('Potential session hijacking detected - User-Agent changed', {
        previousUserAgent: previousUserAgent.substring(0, 50),
        currentUserAgent: currentUserAgent.substring(0, 50)
      });
      return true;
    }
    
    return false;
  },

  // Generate secure session ID
  generateSessionId: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
};

// Content Security Policy utilities
export const CSP = {
  // Generate nonce for inline scripts
  generateNonce: (): string => {
    return crypto.randomUUID();
  },

  // Validate allowed sources
  isValidSource: (source: string, allowedSources: string[]): boolean => {
    return allowedSources.some(allowed => 
      source === allowed || 
      (allowed.endsWith('*') && source.startsWith(allowed.slice(0, -1)))
    );
  }
};

// Password strength validation
export const PasswordValidator = {
  validateStrength: (password: string): { 
    isValid: boolean; 
    score: number; 
    feedback: string[] 
  } => {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
      return { isValid: false, score: 0, feedback: ['Password is required'] };
    }

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(password.toLowerCase())) {
      feedback.push('Avoid common passwords');
      score = Math.min(score, 2);
    }

    const isValid = score >= 4 && password.length >= 12;
    
    return {
      isValid,
      score,
      feedback: isValid ? [] : feedback
    };
  }
};

// API security wrapper
export class SecureApiClient {
  private rateLimiter: RateLimiter;
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
  }

  private async makeSecureRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const clientId = this.getClientIdentifier();
    
    if (!this.rateLimiter.isAllowed(clientId)) {
      throw new Error('Rate limit exceeded');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-Token': this.getCsrfToken()
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.apiError(url, error, { clientId });
      throw error;
    }
  }

  private getClientIdentifier(): string {
    // Create a client identifier based on IP-like characteristics
    return btoa(navigator.userAgent + screen.width + screen.height).substring(0, 32);
  }

  private getCsrfToken(): string {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') || '' : '';
  }

  // Public methods
  async get<T>(endpoint: string): Promise<T> {
    return this.makeSecureRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.makeSecureRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.makeSecureRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeSecureRequest<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const secureApiClient = new SecureApiClient();