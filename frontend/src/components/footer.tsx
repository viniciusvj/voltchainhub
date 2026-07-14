// Shared footer echoing the marketing site's footer (same links + tagline)
// so the app and the landing close the same way. Plain anchors escape basePath.
export function Footer() {
  return (
    <footer className="border-t border-volt-dark-600 px-4 md:px-8 py-6 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <span>⚡ VoltchainHub · v0.1-draft · Apache 2.0 · testnet Amoy</span>
        <nav className="flex items-center gap-4">
          <a href="/" className="hover:text-gray-300 transition-colors">Início</a>
          <a href="/whitepaper.html" className="hover:text-gray-300 transition-colors">Whitepaper</a>
          <a
            href="https://github.com/viniciusvj/voltchainhub"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://github.com/viniciusvj/voltchainhub/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            Discussions
          </a>
        </nav>
      </div>
    </footer>
  )
}
