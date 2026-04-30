"use client"

import { useEffect, useCallback, useState } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"

interface GoogleMapsModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
}

/**
 * Extracts embed URL from various Google Maps URL formats
 */
function getGoogleMapsEmbedUrl(url: string): string | null {
  if (!url) return null
  
  // If it's already an embed URL, return as-is
  if (url.includes("/embed")) {
    return url
  }
  
  // Handle various Google Maps URL formats
  try {
    const urlObj = new URL(url)
    
    // Format: https://www.google.com/maps/place/...
    if (urlObj.hostname.includes("google.com") && urlObj.pathname.includes("/maps")) {
      // Extract coordinates or place from URL
      const placeMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (placeMatch) {
        const lat = placeMatch[1]
        const lng = placeMatch[2]
        return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1`
      }
      
      // Try to extract place query
      const qMatch = url.match(/place\/([^/@]+)/)
      if (qMatch) {
        const query = decodeURIComponent(qMatch[1].replace(/\+/g, " "))
        return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(query)}`
      }
    }
    
    // Format: https://maps.google.com/?q=...
    if (urlObj.searchParams.has("q")) {
      const query = urlObj.searchParams.get("q")
      return `https://www.google.com/maps?q=${query}&output=embed`
    }
    
    // Format: https://goo.gl/maps/... (short URL) - just use iframe with original URL
    if (urlObj.hostname === "goo.gl") {
      return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
    }
    
    // Default: try embedding the URL directly
    return url.replace("/maps/", "/maps/embed/")
  } catch {
    return null
  }
}

export default function GoogleMapsModal({ isOpen, onClose, url, title = "Location Idea" }: GoogleMapsModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
      setIsLoading(true)
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const embedUrl = getGoogleMapsEmbedUrl(url)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-[#0f1f17] sm:rounded-2xl border-0 sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-sans">{title}</h2>
              <p className="text-xs text-white/50 font-sans">Google Maps Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline font-sans">Open in Maps</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative min-h-[300px] sm:min-h-[500px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a2e23]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-white/50 text-sm font-sans">Loading map...</p>
              </div>
            </div>
          )}
          {embedUrl ? (
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`}
              className="w-full h-full"
              style={{ border: 0, minHeight: "300px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-white/50 mb-4 font-sans">Unable to embed this map URL directly.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-black font-semibold text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
