// Utility functions for MicroMe

// Supabase client utilities
export { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
export type { Database } from '../types'

// Type-safe Supabase client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types'
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Error handling utilities
export class APIError extends Error {
  code: string
  details?: Record<string, any>
  timestamp: string
  
  constructor(code: string, message: string, details?: Record<string, any>) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

// Response wrapper for consistent API responses
export const createApiResponse = <T>(data?: T, error?: { code: string; message: string; details?: any }) => {
  if (error) {
    return {
      success: false,
      error: {
        ...error,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID()
      }
    }
  }
  
  return {
    success: true,
    data
  }
}

// Local storage utilities with type safety
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch {
      return defaultValue || null
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.warn(`Failed to save ${key} to localStorage`)
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      console.warn(`Failed to remove ${key} from localStorage`)
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear()
    } catch {
      console.warn('Failed to clear localStorage')
    }
  }
}

// Date formatting utilities
export const formatters = {
  date: (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  },
  
  datetime: (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  },
  
  relative: (date: string | Date) => {
    const now = new Date()
    const target = new Date(date)
    const diffInMs = now.getTime() - target.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }
}

// Number formatting utilities
export const numbers = {
  format: (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-US', options).format(num)
  },
  
  compact: (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num)
  },
  
  percentage: (num: number, decimals = 1) => {
    return `${(num * 100).toFixed(decimals)}%`
  },
  
  currency: (num: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(num)
  }
}

// Array utilities
export const arrays = {
  groupBy: <T, K extends string | number>(arr: T[], key: (item: T) => K): Record<K, T[]> => {
    return arr.reduce((groups, item) => {
      const groupKey = key(item)
      groups[groupKey] = groups[groupKey] || []
      groups[groupKey].push(item)
      return groups
    }, {} as Record<K, T[]>)
  },
  
  unique: <T>(arr: T[], key?: (item: T) => any): T[] => {
    if (!key) return [...new Set(arr)]
    const seen = new Set()
    return arr.filter(item => {
      const keyValue = key(item)
      if (seen.has(keyValue)) return false
      seen.add(keyValue)
      return true
    })
  },
  
  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }
}

// String utilities
export const strings = {
  truncate: (str: string, length: number, suffix = '...') => {
    if (str.length <= length) return str
    return str.slice(0, length - suffix.length) + suffix
  },
  
  slug: (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  },
  
  capitalize: (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  },
  
  camelCase: (str: string) => {
    return str.replace(/[-_\s]+(.)?/g, (_, char) => char?.toUpperCase() || '')
  }
}

// Validation utilities
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
  
  uuid: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  },
  
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  }
}

// File utilities
export const files = {
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || ''
  },
  
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  },
  
  isCSV: (file: File): boolean => {
    return file.type === 'text/csv' || file.name.endsWith('.csv')
  },
  
  readAsText: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }
}

// CSV parsing utilities
export const csv = {
  parse: (csvText: string): Array<Record<string, string>> => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',')
    const data = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        row[header.trim()] = (values[index] || '').trim()
      })
      
      data.push(row)
    }
    
    return data
  },
  
  validate: (data: Array<Record<string, string>>, requiredFields: string[]) => {
    const errors: Array<{ row: number; field: string; message: string }> = []
    
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push({
            row: index + 1,
            field,
            message: `Missing required field: ${field}`
          })
        }
      })
    })
    
    return errors
  }
}

// Async utilities
export const async = {
  retry: async <T>(
    fn: () => Promise<T>, 
    options: { retries?: number; delay?: number } = {}
  ): Promise<T> => {
    const { retries = 3, delay = 1000 } = options
    
    try {
      return await fn()
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return async.retry(fn, { retries: retries - 1, delay })
      }
      throw error
    }
  },
  
  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), ms)
      )
    ])
  },
  
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Environment utilities
export const env = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  get: (key: string, defaultValue?: string): string => {
    return import.meta.env[key] || defaultValue || ''
  },
  
  require: (key: string): string => {
    const value = import.meta.env[key]
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`)
    }
    return value
  }
}

// Analytics utilities
export const analytics = {
  calculateEngagementRate: (likes: number, comments: number, shares: number, reach: number): number => {
    if (reach === 0) return 0
    return (likes + comments + shares) / reach
  },
  
  calculateGrowthRate: (current: number, previous: number): number => {
    if (previous === 0) return 0
    return (current - previous) / previous
  },
  
  averageArray: (arr: number[]): number => {
    if (arr.length === 0) return 0
    return arr.reduce((sum, val) => sum + val, 0) / arr.length
  },
  
  median: (arr: number[]): number => {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle]
  }
}

// Default export with all utilities
const utils = {
  APIError,
  createApiResponse,
  storage,
  formatters,
  numbers,
  arrays,
  strings,
  validators,
  files,
  csv,
  async,
  env,
  analytics
}

export default utils