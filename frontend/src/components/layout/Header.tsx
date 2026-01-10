/** Application header with logo */
export function Header() {
  return (
    <header className="scanlines border-b-[3px] border-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold tracking-wider glitch border-none">
          <span className="text-accent">SNIP</span>
          <span className="text-white">_</span>
        </a>
      </div>
    </header>
  )
}
