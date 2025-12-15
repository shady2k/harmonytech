import { type ReactElement, type ReactNode, memo } from 'react'
import { parseTextWithLinks, type TextSegment } from '@/lib/text-utils'

interface LinkifiedTextProps {
  text: string
  className?: string
  linkClassName?: string
}

/**
 * Renders text with clickable links
 * URLs are automatically detected and rendered as anchor tags
 */
function LinkifiedTextComponent({
  text,
  className = '',
  linkClassName = 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline break-all',
}: LinkifiedTextProps): ReactElement {
  const segments = parseTextWithLinks(text)

  const renderSegment = (segment: TextSegment, index: number): ReactNode => {
    if (segment.type === 'link') {
      return (
        <a
          key={index}
          href={segment.content}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          onClick={(e): void => {
            e.stopPropagation()
          }}
        >
          {segment.content}
        </a>
      )
    }
    return <span key={index}>{segment.content}</span>
  }

  return <span className={className}>{segments.map(renderSegment)}</span>
}

export const LinkifiedText = memo(LinkifiedTextComponent)
