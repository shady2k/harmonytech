/**
 * Text utility functions for parsing and formatting text content
 */

// URL regex pattern that matches http/https URLs
const URL_REGEX = /(https?:\/\/[^\s<>[\](){}]+)/gi

/**
 * Segments text into parts, separating URLs from regular text
 */
export interface TextSegment {
  type: 'text' | 'link'
  content: string
}

/**
 * Parse text and extract URL segments
 * Returns an array of segments with type and content
 */
export function parseTextWithLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let lastIndex = 0

  // Reset regex state
  URL_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      })
    }

    // Add the URL
    segments.push({
      type: 'link',
      content: match[0],
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    })
  }

  // If no segments (no URLs found), return the whole text
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text })
  }

  return segments
}

/**
 * Check if a text contains any URLs
 */
export function containsUrl(text: string): boolean {
  URL_REGEX.lastIndex = 0
  return URL_REGEX.test(text)
}

/**
 * Truncate text to a maximum length, preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}
