interface FooterProps {
  /** API connection status: null (checking), true (connected), false (offline) */
  apiStatus: boolean | null
}

/** Application footer with API status indicator */
export function Footer({ apiStatus }: FooterProps) {
  return (
    <footer className="border-t-[3px] border-[#2a2a2a] mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#f5f5f0]/50">
          <div className="flex items-center gap-2">
            <span className="text-[#d4ff00]">SNIP_</span>
            <span>// URL Shortener</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  apiStatus === null
                    ? 'bg-[#f5f5f0]/50 animate-pulse'
                    : apiStatus
                    ? 'bg-[#d4ff00]'
                    : 'bg-[#ff3333]'
                }`}
              ></span>
              <span
                className={`text-xs font-mono uppercase tracking-wider ${
                  apiStatus === null
                    ? 'text-[#f5f5f0]/50'
                    : apiStatus
                    ? 'text-[#d4ff00]'
                    : 'text-[#ff3333]'
                }`}
              >
                {apiStatus === null ? 'CHECKING...' : apiStatus ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
            <span className="text-[#d4ff00]">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
