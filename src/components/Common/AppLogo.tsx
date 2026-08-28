import React from 'react'

interface AppLogoProps {
  size?: number | string
  className?: string
  alt?: string
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 32,
  className = '',
  alt = '你画我猜 Logo'
}) => {
  const dimStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {}

  return (
    <img
      src="/logo.svg"
      style={dimStyle}
      className={`shrink-0 object-contain select-none ${className}`}
      alt={alt}
    />
  )
}
