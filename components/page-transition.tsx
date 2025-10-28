'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setTransitioning(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [children, displayChildren])

  return (
    <div
      style={{
        opacity: transitioning ? 0.7 : 1,
        transition: 'opacity 0.15s ease-in-out',
      }}
    >
      {displayChildren}
    </div>
  )
}
