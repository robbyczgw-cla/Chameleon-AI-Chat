/**
 * Sandpack Utilities
 * Helper functions for detecting templates and generating file structures
 */

export type SandpackTemplate = "react" | "vanilla" | "static" | "vue" | "svelte"

/**
 * Map of language identifiers to Sandpack templates
 */
export const SANDPACK_LANGUAGE_MAP: Record<string, SandpackTemplate> = {
  jsx: "react",
  tsx: "react",
  javascript: "vanilla",
  js: "vanilla",
  html: "static",
  vue: "vue",
  svelte: "svelte",
}

/**
 * Languages that support sandbox execution
 */
export const SANDPACK_SUPPORTED_LANGUAGES = Object.keys(SANDPACK_LANGUAGE_MAP)

/**
 * Check if a language supports sandbox execution
 */
export function isSandpackSupported(language: string): boolean {
  return language.toLowerCase() in SANDPACK_LANGUAGE_MAP
}

/**
 * Detect the appropriate Sandpack template based on code content and language
 */
export function detectSandpackTemplate(code: string, language: string): SandpackTemplate | null {
  const lang = language.toLowerCase()

  // Direct language mapping
  if (lang in SANDPACK_LANGUAGE_MAP) {
    return SANDPACK_LANGUAGE_MAP[lang]
  }

  // Content-based detection for ambiguous cases
  if (lang === "typescript" || lang === "ts") {
    // Check if it looks like React/TSX
    if (hasReactPatterns(code)) {
      return "react"
    }
    return "vanilla"
  }

  return null
}

/**
 * Check if code contains React patterns
 */
function hasReactPatterns(code: string): boolean {
  const reactPatterns = [
    /import\s+.*\s+from\s+['"]react['"]/,
    /from\s+['"]react['"]/,
    /React\./,
    /useState|useEffect|useCallback|useMemo|useRef/,
    /<[A-Z][a-zA-Z]*[\s/>]/,  // JSX component tags
    /export\s+default\s+function\s+\w+\s*\(/,  // Common React component pattern
    /return\s*\(/,  // JSX return
  ]

  return reactPatterns.some(pattern => pattern.test(code))
}

/**
 * Generate Sandpack files object based on template and code
 */
export function generateSandpackFiles(
  code: string,
  template: SandpackTemplate
): Record<string, { code: string; active?: boolean }> {
  switch (template) {
    case "react":
      return generateReactFiles(code)
    case "static":
      return generateStaticFiles(code)
    case "vanilla":
      return generateVanillaFiles(code)
    case "vue":
      return generateVueFiles(code)
    case "svelte":
      return generateSvelteFiles(code)
    default:
      return { "/App.js": { code, active: true } }
  }
}

/**
 * Generate React project files
 */
function generateReactFiles(code: string): Record<string, { code: string; active?: boolean }> {
  // Check if it's a complete component or just JSX snippet
  const isCompleteComponent = /^(import|export|function|const|class)\s/.test(code.trim())

  if (isCompleteComponent) {
    // User provided a complete component
    return {
      "/App.js": {
        code,
        active: true
      },
    }
  }

  // Wrap JSX snippet in a component
  const wrappedCode = `export default function App() {
  return (
    ${code}
  )
}`

  return {
    "/App.js": {
      code: wrappedCode,
      active: true
    },
  }
}

/**
 * Generate static HTML files
 */
function generateStaticFiles(code: string): Record<string, { code: string; active?: boolean }> {
  // Check if it's a complete HTML document
  const isCompleteHtml = /<(!doctype|html)/i.test(code.trim())

  if (isCompleteHtml) {
    return {
      "/index.html": { code, active: true },
    }
  }

  // Wrap in basic HTML structure
  const wrappedCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 1rem; }
  </style>
</head>
<body>
${code}
</body>
</html>`

  return {
    "/index.html": { code: wrappedCode, active: true },
  }
}

/**
 * Generate vanilla JavaScript files
 */
function generateVanillaFiles(code: string): Record<string, { code: string; active?: boolean }> {
  return {
    "/index.html": {
      code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 1rem; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="index.js"></script>
</body>
</html>`,
    },
    "/index.js": {
      code,
      active: true
    },
  }
}

/**
 * Generate Vue SFC files
 */
function generateVueFiles(code: string): Record<string, { code: string; active?: boolean }> {
  // Check if it's already a complete SFC
  const isCompleteSFC = /<template>|<script>|<style>/.test(code)

  if (isCompleteSFC) {
    return {
      "/src/App.vue": { code, active: true },
    }
  }

  // Wrap in basic Vue SFC structure
  const wrappedCode = `<template>
  ${code}
</template>

<script setup>
// Your script here
</script>

<style scoped>
/* Your styles here */
</style>`

  return {
    "/src/App.vue": { code: wrappedCode, active: true },
  }
}

/**
 * Generate Svelte files
 */
function generateSvelteFiles(code: string): Record<string, { code: string; active?: boolean }> {
  return {
    "/App.svelte": { code, active: true },
  }
}

/**
 * Extract dependencies from code (basic detection)
 */
export function extractDependencies(code: string): Record<string, string> {
  const dependencies: Record<string, string> = {}

  // Match import statements
  const importRegex = /import\s+.*\s+from\s+['"]([^'"./][^'"]*)['"]/g
  let match

  while ((match = importRegex.exec(code)) !== null) {
    const packageName = match[1].split("/")[0] // Handle scoped packages
    // Skip react/react-dom as they're included by default
    if (!["react", "react-dom"].includes(packageName)) {
      dependencies[packageName] = "latest"
    }
  }

  return dependencies
}
