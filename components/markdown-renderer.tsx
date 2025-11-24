"use client"

/**
 * MarkdownRenderer Component
 * Handles rendering of markdown content with syntax highlighting,
 * tables, code blocks, and other formatting.
 */

import { memo, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const { toast } = useToast()

  const handleCopyCode = useCallback(
    async (code: string) => {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Code copied",
        description: "Code block copied to clipboard",
      })
    },
    [toast]
  )

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ children }) => (
            <p className="mb-4 last:mb-0 leading-7">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0 scroll-m-20">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3 first:mt-0 scroll-m-20">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0 scroll-m-20">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-3 mb-2 first:mt-0">
              {children}
            </h4>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-border" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-full border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2.5 text-left font-semibold border-r border-border last:border-r-0 text-xs sm:text-sm whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2.5 border-r border-border last:border-r-0 text-xs sm:text-sm align-top">
              {children}
            </td>
          ),
          input: ({ checked, type, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-2 align-middle"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : ""
            const codeString = String(children).replace(/\n$/, "")

            return !inline && match ? (
              <div className="relative group/code my-4 rounded-lg w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-t-lg w-full">
                  <span className="text-xs text-zinc-400 font-mono">
                    {language}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs opacity-0 group-hover/code:opacity-100 transition-opacity"
                    onClick={() => handleCopyCode(codeString)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  wrapLines
                  wrapLongLines
                  customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: "0.5rem",
                    borderBottomRightRadius: "0.5rem",
                    width: "100%",
                    maxWidth: "100%",
                    overflow: "auto",
                  }}
                  codeTagProps={{
                    style: {
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    },
                  }}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border break-all inline-block max-w-full"
                {...props}
              >
                {children}
              </code>
            )
          },
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || "Product image"}
              className="max-w-full sm:max-w-sm md:max-w-md h-auto rounded-lg my-4 border border-border"
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
