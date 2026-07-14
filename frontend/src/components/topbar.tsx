import { FlaskConical } from 'lucide-react'

// Shared top bar that echoes the marketing site's header (same destinations)
// so the app and the landing read as one product. Plain anchors escape the
// app basePath and reach the site root / whitepaper.
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-11 px-4 md:px-6 bg-volt-dark-800/80 backdrop-blur border-b border-volt-dark-600">
      <a
        href="https://amoy.polygonscan.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full hover:bg-amber-400/20 transition-colors"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        Testnet Amoy
      </a>

      <nav className="flex items-center gap-4 text-sm">
        <a href="/" className="text-gray-400 hover:text-white transition-colors">Início</a>
        <a href="/whitepaper.html" className="text-gray-400 hover:text-white transition-colors">Whitepaper</a>
        <a
          href="https://github.com/viniciusvj/voltchainhub"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          GitHub
        </a>
      </nav>
    </header>
  )
}
