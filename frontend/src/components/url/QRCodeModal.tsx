import { useState, useEffect } from 'react'
import type { ShortenedURL } from '../../types'
import { API_BASE } from '../../constants'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  url: ShortenedURL | null
}

/** QR Code modal for generating and downloading QR codes */
export function QRCodeModal({ isOpen, onClose, url }: QRCodeModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrSize, setQrSize] = useState(200)

  const qrUrl = url ? `${API_BASE}/api/urls/${url.short_code}/qr?size=${qrSize}` : ''

  useEffect(() => {
    if (isOpen && url) {
      setLoading(true)
      setError(null)
    }
  }, [isOpen, url, qrSize])

  if (!isOpen || !url) return null

  const handleImageLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleImageError = () => {
    setLoading(false)
    setError('Failed to load QR code')
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/urls/${url.short_code}/qr?size=400`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${url.short_code}_qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Failed to download QR code:', err)
      setError('Failed to download QR code')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md bg-[#1a1a1a] border-[3px] border-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1a1a1a] border-b-[3px] border-[#2a2a2a] p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-wider">
            <span className="text-[#d4ff00]">QR CODE:</span>
            <span className="text-white"> {url.short_code}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-[#f5f5f0]/50 hover:text-[#ff3333] text-2xl leading-none transition-colors border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative bg-white p-4 border-[3px] border-[#2a2a2a]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="w-8 h-8 border-[3px] border-[#d4ff00] border-t-transparent animate-spin"></div>
                </div>
              )}
              {error ? (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-[#ff3333] font-mono text-sm text-center p-4">
                  {error}
                </div>
              ) : (
                <img
                  src={qrUrl}
                  alt={`QR Code for ${url.short_code}`}
                  width={qrSize}
                  height={qrSize}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className={loading ? 'opacity-0' : 'opacity-100'}
                />
              )}
            </div>

            {/* Short URL Display */}
            <p className="text-[#d4ff00] font-mono text-sm text-center break-all">
              {url.short_url}
            </p>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <label className="text-[#f5f5f0]/70 text-xs font-mono uppercase tracking-wider">
              SIZE
            </label>
            <div className="flex gap-2">
              {[150, 200, 300].map((size) => (
                <button
                  key={size}
                  onClick={() => setQrSize(size)}
                  className={`flex-1 border-[2px] px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                    qrSize === size
                      ? 'border-[#d4ff00] bg-[#d4ff00] text-[#0a0a0a]'
                      : 'border-[#2a2a2a] bg-transparent text-[#f5f5f0]/70 hover:border-[#d4ff00] hover:text-[#d4ff00]'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={loading || !!error}
            className="w-full border-[3px] border-[#d4ff00] bg-[#d4ff00] text-[#0a0a0a] py-3 font-mono font-bold uppercase tracking-wider hover:bg-transparent hover:text-[#d4ff00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↓ DOWNLOAD QR CODE
          </button>

          {/* Info Text */}
          <p className="text-[#f5f5f0]/40 text-xs font-mono text-center">
            // SCAN TO ACCESS SHORT URL
          </p>
        </div>
      </div>
    </div>
  )
}
