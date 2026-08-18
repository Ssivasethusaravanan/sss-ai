'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';
import { useState, useCallback } from 'react';

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const language = className?.replace('hljs language-', '')?.replace('language-', '') || '';

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-200 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code Content */}
      <pre className="!bg-transparent !m-0 !p-4 overflow-x-auto text-sm leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Code blocks
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const isBlock = className?.includes('language-') || className?.includes('hljs');
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-white/10 text-emerald-300 text-[13px] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                {children}
              </a>
            );
          },
          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-white/5 border-b border-white/10">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-300 uppercase tracking-wider">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 text-neutral-300 border-t border-white/5">{children}</td>;
          },
          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-emerald-500/50 pl-4 my-4 text-neutral-400 italic">
                {children}
              </blockquote>
            );
          },
          // Lists
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1.5 my-3 text-neutral-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1.5 my-3 text-neutral-200">{children}</ol>;
          },
          // Headings
          h1({ children }) {
            return <h1 className="text-xl font-bold mt-6 mb-3 text-neutral-100">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mt-5 mb-2 text-neutral-100">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mt-4 mb-2 text-neutral-200">{children}</h3>;
          },
          // Paragraphs
          p({ children }) {
            return <p className="my-2 leading-relaxed text-neutral-200">{children}</p>;
          },
          // Horizontal rule
          hr() {
            return <hr className="my-6 border-white/10" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
