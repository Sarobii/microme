interface CSVPost {
  content: string
  date?: string
  likes?: number
  comments?: number
  shares?: number
  id?: string
}

export interface ParseResult {
  success: boolean
  data?: CSVPost[]
  error?: string
}

/**
 * Enhanced CSV parser that handles various CSV formats and edge cases
 */
export function parseLinkedInCSV(csvText: string): ParseResult {
  try {
    // Clean and split lines
    const lines = csvText
      .replace(/\r\n/g, '\n') // Normalize line endings
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV file must contain at least a header row and one data row.'
      }
    }

    // Parse headers with better CSV handling
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
    
    // Find column indices with flexible matching
    const contentIndex = findColumnIndex(headers, ['content', 'text', 'post', 'description', 'body'])
    if (contentIndex === -1) {
      return {
        success: false,
        error: 'CSV must contain a column with content (e.g., "content", "text", "post", "description", or "body").'
      }
    }

    // Optional columns with flexible matching
    const dateIndex = findColumnIndex(headers, ['date', 'time', 'created', 'published', 'timestamp', 'created_at', 'published_at'])
    const likesIndex = findColumnIndex(headers, ['likes', 'like', 'reactions', 'thumbs_up', 'hearts'])
    const commentsIndex = findColumnIndex(headers, ['comments', 'comment', 'replies', 'responses'])
    const sharesIndex = findColumnIndex(headers, ['shares', 'share', 'reposts', 'retweets', 'forwards'])
    const idIndex = findColumnIndex(headers, ['id', 'post_id', 'postid', 'identifier', 'uuid'], ['user_id', 'userid', 'user'])

    const posts: CSVPost[] = []

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const columns = parseCSVLine(lines[i])
        
        if (columns.length < Math.max(1, contentIndex + 1)) {
          console.warn(`Row ${i + 1}: Insufficient columns, skipping`)
          continue
        }

        const content = cleanCellValue(columns[contentIndex])
        if (!content || content.length < 10) {
          console.warn(`Row ${i + 1}: Content too short or empty, skipping`)
          continue
        }

        const post: CSVPost = {
          content,
          date: dateIndex >= 0 ? parseDate(cleanCellValue(columns[dateIndex])) : undefined,
          likes: likesIndex >= 0 ? parseNumber(cleanCellValue(columns[likesIndex])) : 0,
          comments: commentsIndex >= 0 ? parseNumber(cleanCellValue(columns[commentsIndex])) : 0,
          shares: sharesIndex >= 0 ? parseNumber(cleanCellValue(columns[sharesIndex])) : 0,
          id: idIndex >= 0 ? cleanCellValue(columns[idIndex]) : `csv_${i}_${Date.now()}`
        }

        posts.push(post)
      } catch (rowError) {
        console.warn(`Row ${i + 1}: Parse error, skipping:`, rowError)
        continue
      }
    }

    if (posts.length === 0) {
      return {
        success: false,
        error: 'No valid posts found in CSV file. Please check the content column and ensure posts have sufficient text.'
      }
    }

    return {
      success: true,
      data: posts
    }

  } catch (error) {
    console.error('CSV parsing error:', error)
    return {
      success: false,
      error: `Error parsing CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Parse a CSV line handling quoted values and commas within quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"'
        i += 2
        continue
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
    i++
  }

  result.push(current)
  return result
}

/**
 * Find column index with flexible matching
 */
function findColumnIndex(headers: string[], searchTerms: string[], excludeTerms: string[] = []): number {
  for (const term of searchTerms) {
    const index = headers.findIndex(header => {
      const includesTerm = header.includes(term)
      const excludesTerms = excludeTerms.length === 0 || !excludeTerms.some(exclude => header.includes(exclude))
      return includesTerm && excludesTerms
    })
    if (index !== -1) return index
  }
  return -1
}

/**
 * Clean cell value by removing quotes and trimming
 */
function cleanCellValue(value: string): string {
  if (!value) return ''
  return value.replace(/^"(.*)"$/, '$1').trim()
}

/**
 * Parse date string with multiple format support
 */
function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      // Try common date formats
      const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      ]
      
      for (const format of formats) {
        if (format.test(dateStr)) {
          const parsed = new Date(dateStr)
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString()
          }
        }
      }
      return undefined
    }
    return date.toISOString()
  } catch {
    return undefined
  }
}

/**
 * Parse number value with error handling
 */
function parseNumber(value: string): number {
  if (!value) return 0
  const num = parseInt(value.replace(/[^\d]/g, ''), 10)
  return isNaN(num) ? 0 : num
}