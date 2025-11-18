import Link from "next/link"

export function LegalFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦎</span>
            <span>© {new Date().getFullYear()} Chameleon AI Chat</span>
          </div>

          <nav className="flex items-center gap-4 md:gap-6">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Cookies
            </Link>
          </nav>

          <div className="text-center md:text-right">
            <p>Made with ❤️ and ☕</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
