'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Custom navigation hook for SPA-style routing
 * Provides smooth transitions without page reload
 */
export function useAppNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = useCallback((path: string) => {
    if (pathname === path) {
      return // Already on this page
    }

    // Navigate
    router.push(path)
  }, [router, pathname])

  const replace = useCallback((path: string) => {
    router.replace(path)
  }, [router])

  const back = useCallback(() => {
    router.back()
  }, [router])

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  return {
    navigate,
    replace,
    back,
    refresh,
    currentPath: pathname,
  }
}
