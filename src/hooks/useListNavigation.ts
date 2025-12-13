/**
 * Hook for keyboard list navigation (j/k navigation)
 */

import { useState, useCallback } from 'react'

interface UseListNavigationOptions<T> {
  items: T[]
  enabled?: boolean
  wrap?: boolean
  onSelect?: (item: T, index: number) => void
}

interface UseListNavigationReturn<T> {
  selectedIndex: number
  selectedItem: T | null
  selectNext: () => void
  selectPrev: () => void
  selectItem: (index: number) => void
  clearSelection: () => void
}

export function useListNavigation<T>({
  items,
  enabled = true,
  wrap = false,
  onSelect,
}: UseListNavigationOptions<T>): UseListNavigationReturn<T> {
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Compute the effective selected index based on items length
  // This avoids setState inside useEffect which causes cascading renders
  const effectiveSelectedIndex =
    selectedIndex >= items.length ? (items.length > 0 ? 0 : -1) : selectedIndex

  // Reset selectedIndex state when it becomes invalid
  // Using a ref to track if we need to reset prevents infinite loops
  if (selectedIndex >= items.length && selectedIndex !== effectiveSelectedIndex) {
    setSelectedIndex(effectiveSelectedIndex)
  }

  const selectNext = useCallback(() => {
    if (!enabled || items.length === 0) return

    setSelectedIndex((current) => {
      const next = current + 1
      if (next >= items.length) {
        return wrap ? 0 : current
      }
      return next
    })
  }, [enabled, items.length, wrap])

  const selectPrev = useCallback(() => {
    if (!enabled || items.length === 0) return

    setSelectedIndex((current) => {
      if (current <= 0) {
        return wrap ? items.length - 1 : 0
      }
      return current - 1
    })
  }, [enabled, items.length, wrap])

  const selectItem = useCallback(
    (index: number) => {
      if (!enabled) return
      if (index >= 0 && index < items.length) {
        setSelectedIndex(index)
        if (onSelect) {
          onSelect(items[index], index)
        }
      }
    },
    [enabled, items, onSelect]
  )

  const clearSelection = useCallback(() => {
    setSelectedIndex(-1)
  }, [])

  const selectedItem =
    effectiveSelectedIndex >= 0 && effectiveSelectedIndex < items.length
      ? items[effectiveSelectedIndex]
      : null

  return {
    selectedIndex: effectiveSelectedIndex,
    selectedItem,
    selectNext,
    selectPrev,
    selectItem,
    clearSelection,
  }
}
