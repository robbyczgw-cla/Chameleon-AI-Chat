import fs from "node:fs"
import path from "node:path"

const repoRoot = path.resolve(process.cwd())

function fail(message) {
  console.error(`PWA smoke check failed: ${message}`)
  process.exitCode = 1
}

function ok(message) {
  console.log(`OK: ${message}`)
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8")
  return JSON.parse(raw)
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath))
}

function assert(condition, message) {
  if (!condition) fail(message)
}

// 1) Manifest basics
const manifestPath = path.join(repoRoot, "public/manifest.json")
assert(fs.existsSync(manifestPath), "public/manifest.json missing")
const manifest = readJson(manifestPath)

assert(typeof manifest.name === "string" && manifest.name.length > 0, "manifest.name missing")
assert(typeof manifest.short_name === "string" && manifest.short_name.length > 0, "manifest.short_name missing")
assert(manifest.start_url === "/", "manifest.start_url should be '/'")
assert(manifest.scope === "/", "manifest.scope should be '/'")
assert(manifest.display === "standalone", "manifest.display should be 'standalone'")
assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest.icons missing/empty")

for (const icon of manifest.icons) {
  if (!icon?.src) continue
  const iconPath = icon.src.startsWith("/") ? icon.src.slice(1) : icon.src
  // Manifest icon paths are served from /public
  const onDiskPath = iconPath.startsWith("public/") ? iconPath : path.posix.join("public", iconPath)
  assert(fileExists(onDiskPath), `manifest icon missing: ${onDiskPath}`)
}
ok("manifest.json icons exist")

// 2) Service worker presence and key cached assets
const swPath = path.join(repoRoot, "public/sw.js")
assert(fs.existsSync(swPath), "public/sw.js missing")
const swText = fs.readFileSync(swPath, "utf8")

// Minimal sanity: should pre-cache core shell bits used by PWA startup
const mustMention = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"]
for (const entry of mustMention) {
  assert(swText.includes(entry), `sw.js does not mention '${entry}' (expected in precache list)`)
}
ok("sw.js mentions core precache URLs")

// 3) Next config routes for PWA assets
const nextConfigPath = path.join(repoRoot, "next.config.mjs")
assert(fs.existsSync(nextConfigPath), "next.config.mjs missing")
const nextConfigText = fs.readFileSync(nextConfigPath, "utf8")
for (const route of ["/sw.js", "/manifest.json"]) {
  assert(nextConfigText.includes(route), `next.config.mjs does not include route for '${route}'`)
}
ok("next.config.mjs routes PWA assets")

// 4) Critical PWA loader + registration components still present
const layoutPath = path.join(repoRoot, "app/layout.tsx")
assert(fs.existsSync(layoutPath), "app/layout.tsx missing")
const layoutText = fs.readFileSync(layoutPath, "utf8")
assert(layoutText.includes("<PWARegister />"), "PWARegister not rendered in app/layout.tsx")
assert(layoutText.includes("pwa-loading-screen"), "PWA loading screen missing in app/layout.tsx")
ok("PWA loader + register present")

// 5) CSS safety: chameleon texture should not block input/touch and must be disable-able
const globalsCssPath = path.join(repoRoot, "app/globals.css")
assert(fs.existsSync(globalsCssPath), "app/globals.css missing")
const globalsCss = fs.readFileSync(globalsCssPath, "utf8")
assert(globalsCss.includes(".chameleon-scales"), "chameleon-scales CSS missing")
assert(globalsCss.includes("pointer-events: none"), "chameleon-scales should be pointer-events: none")
assert(
  globalsCss.includes(".performance-mode .chameleon-scales") || globalsCss.includes(".ultra-performance-mode .chameleon-scales"),
  "chameleon-scales should be disabled in performance modes",
)
ok("chameleon-scales is non-interactive and disable-able")

if (!process.exitCode) {
  console.log("PWA smoke check passed.")
}
