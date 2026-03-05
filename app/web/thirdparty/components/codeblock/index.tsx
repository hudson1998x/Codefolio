import React, { useEffect, useRef, useState } from "react";
import { registerComponent } from "../registry";
import './style.scss';

/**
 * Supported syntax highlighting languages.
 *
 * @remarks
 * All languages are loaded on-demand via the Prism autoloader plugin,
 * so adding a language here has zero bundle cost — it's only fetched
 * from CDN when actually used on the page.
 */
const LANGUAGES = [
  // Web
  'javascript', 'typescript', 'jsx', 'tsx',
  'html', 'css', 'scss', 'json', 'graphql',
  // Backend
  'php', 'python', 'ruby', 'java', 'csharp',
  'go', 'rust', 'swift', 'kotlin', 'scala',
  // Systems
  'cpp', 'c', 'objectivec',
  // Shell / Config
  'bash', 'shell', 'powershell', 'yaml', 'toml', 'dockerfile',
  // Database
  'sql',
  // Other
  'markdown', 'latex', 'r'
] as const;

export type CodeLanguage = typeof LANGUAGES[number];

/**
 * Display-friendly labels for languages whose Prism key isn't human-readable.
 * Any language not listed here will have its key used as-is, capitalised.
 */
const LANGUAGE_LABELS: Partial<Record<CodeLanguage, string>> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  graphql: 'GraphQL',
  php: 'PHP',
  python: 'Python',
  ruby: 'Ruby',
  java: 'Java',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
  swift: 'Swift',
  kotlin: 'Kotlin',
  scala: 'Scala',
  cpp: 'C++',
  c: 'C',
  objectivec: 'Objective-C',
  bash: 'Bash',
  shell: 'Shell',
  powershell: 'PowerShell',
  yaml: 'YAML',
  toml: 'TOML',
  dockerfile: 'Dockerfile',
  sql: 'SQL',
  markdown: 'Markdown',
  latex: 'LaTeX',
  r: 'R',
};

export interface CodeBlockData {
  code: string;
  language: CodeLanguage | string;
  filename: string;
  showCopy: string;
  className: string;
}

/**
 * A syntax-highlighted code block powered by Prism.js (loaded via CDN).
 *
 * @remarks
 * Prism core + the autoloader plugin are injected once into the document
 * head on first mount and shared across all CodeBlock instances. The
 * autoloader fetches individual language grammars on demand, so only
 * languages actually rendered on the page incur a network request.
 *
 * Highlighting is re-applied via `Prism.highlightElement` whenever `code`
 * or `language` changes, with a brief polling loop to handle the async
 * CDN load on first render.
 *
 * The copy button writes to the clipboard and shows a brief confirmation.
 * The optional `filename` prop renders a label in the top bar; if omitted
 * the language name is shown instead.
 */
export const CodeBlock: React.FC<{ data: CodeBlockData }> = ({ data }) => {
  const { code, language = 'javascript', filename, showCopy = 'true', className } = data;
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Injects Prism core + autoloader from CDN if not already present.
   * Runs once on first mount — subsequent CodeBlock instances reuse
   * the already-injected scripts.
   */
  useEffect(() => {
    if (document.getElementById('prism-css')) return;

    const link = document.createElement('link');
    link.id = 'prism-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.id = 'prism-js';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js';
    script.onload = () => {
      const autoloader = document.createElement('script');
      autoloader.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js';
      document.head.appendChild(autoloader);
    };
    document.head.appendChild(script);
  }, []);

  /**
   * Re-highlights the code element whenever `code` or `language` changes.
   *
   * @remarks
   * Polls until `window.Prism` is available (max ~2s) to handle the
   * async CDN load on first render. Subsequent renders highlight immediately.
   */
  useEffect(() => {
    if (!codeRef.current) return;

    const highlight = () => {
      if ((window as any).Prism && codeRef.current) {
        (window as any).Prism.highlightElement(codeRef.current);
      }
    };

    let attempts = 0;
    const interval = setInterval(() => {
      if ((window as any).Prism) { highlight(); clearInterval(interval); }
      if (++attempts > 20) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [code, language]);

  /** Copies the raw code string to the clipboard and shows a 2s confirmation. */
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayLabel = filename || LANGUAGE_LABELS[language as CodeLanguage] || language;

  return (
    <div className={`cf-code-block ${className ?? ''}`}>
      {(filename || showCopy === 'true') && (
        <div className="cf-code-block__bar">
          <span className="cf-code-block__filename">{displayLabel}</span>
          {showCopy === 'true' && (
            <button
              type="button"
              className={`cf-code-block__copy ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )}
      <pre className={`cf-code-block__pre language-${language}`}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

registerComponent({
  name: "CodeBlock",
  defaults: {
    code: '// Your code here',
    language: 'javascript',
    filename: '',
    showCopy: 'true',
    className: '',
  },
  fields: {
    code:     { type: 'textarea', label: 'Code' },
    language: { type: 'select',   label: 'Language', options: [...LANGUAGES] },
    showCopy: { type: 'boolean',  label: 'Show Copy Button' },
    filename: { type: 'text',     label: 'Filename (optional)' },
    className:{ type: 'text',     label: 'Class Name' },
  },
  component: CodeBlock as any,
  isCmsEditor: true,
  category: 'Content',
  icon: 'fas fa-code',
});