"use client"

import { useState } from "react"
import { AlertCircle } from 'lucide-react'

interface EnhancedImageProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  showErrorIndicator?: boolean
  showLoadingIndicator?: boolean
}

export function EnhancedImage({
  src,
  alt,
  className = "",
  fallbackSrc,
  placeholder,
  onLoad,
  onError,
  showErrorIndicator = true,
  showLoadingIndicator = true,
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)

    // Try fallback if available and not already tried
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setIsLoading(true)
      setHasError(false)
      return
    }

    // Use placeholder if available
    if (placeholder && currentSrc !== placeholder) {
      setCurrentSrc(placeholder)
      setIsLoading(true)
      setHasError(false)
      return
    }

    onError?.()
  }

  const handleLoadStart = () => {
    setIsLoading(true)
    setHasError(false)
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={currentSrc || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
      />

      {/* Loading Indicator */}
      {isLoading && showLoadingIndicator && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {/* Error Indicator */}
      {hasError && showErrorIndicator && (
        <div className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  )
}
