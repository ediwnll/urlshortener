/** Hero section with main headline */
export function HeroSection() {
  return (
    <section className="py-16 md:py-24 text-center">
      <h1 className="text-display text-4xl md:text-6xl lg:text-7xl mb-6 glitch-intense">
        SHORTEN YOUR URLS<span className="cursor"></span>
      </h1>
      <p className="text-lg md:text-xl text-[#f5f5f0]/70 max-w-2xl mx-auto mb-2">
        Fast. Simple. Brutal.
      </p>
      <p className="text-sm text-[#f5f5f0]/50 font-mono">
        {'>'} No tracking. No bullshit. Just short links.
      </p>
    </section>
  )
}
