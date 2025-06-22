
import DOMPurify from 'dompurify';

// Input validation utilities
export const validateTradeInput = (value: string | number): boolean => {
  if (typeof value === 'string') {
    // Remove any potentially dangerous characters
    const sanitized = value.replace(/[<>\"'%;()&+]/g, '');
    return sanitized === value && value.length <= 50;
  }
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value) && value >= 0;
  }
  return false;
};

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim());
};

export const validateTradingAmount = (amount: number, maxAmount: number = 1000000): boolean => {
  return amount > 0 && amount <= maxAmount && Number.isFinite(amount);
};

export const validateSymbol = (symbol: string): boolean => {
  const symbolRegex = /^[A-Z]{2,10}(\/[A-Z]{2,10})?$/;
  return symbolRegex.test(symbol.toUpperCase());
};

// Rate limiting for API calls
class RateLimit {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

export const apiRateLimit = new RateLimit();

// Secure session management
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateSession = (token: string): boolean => {
  // In production, this would validate against a secure backend
  return token && token.length === 64 && /^[a-f0-9]+$/.test(token);
};
