import React, { useState, useRef, useEffect } from 'react'

interface TooltipWrapperProps {
  content: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
  children: React.ReactNode
}

export function TooltipWrapper({ content, position = 'top', delay = 500, children }: TooltipWrapperProps) {
  const [visible, setVisible] = useState(false)
  const [showTimeout, setShowTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    const timeout = setTimeout(() => {
      setVisible(true)
    }, delay)
    setShowTimeout(timeout)
  }

  const hideTooltip = () => {
    if (showTimeout) {
      clearTimeout(showTimeout)
    }
    setVisible(false)
  }

  useEffect(() => {
    return () => {
      if (showTimeout) {
        clearTimeout(showTimeout)
      }
    }
  }, [showTimeout])

  const positionStyles: Record<string, React.CSSProperties> = {
    top: {
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '8px',
    },
    right: {
      position: 'absolute',
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '8px',
    },
    bottom: {
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '8px',
    },
    left: {
      position: 'absolute',
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: '8px',
    },
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {visible && (
        <div
          className="z-50 bg-slate-900 text-white text-xs rounded-lg px-2 py-1.5 max-w-64 shadow-lg border border-slate-700 pointer-events-none"
          style={positionStyles[position]}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}