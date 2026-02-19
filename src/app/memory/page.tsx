"use client";

import { cloneElement, isValidElement, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Navigation } from "@/components/navigation";

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

interface SearchResult {
  file: string;
  line: number;
  preview: string;
  context: string;
}

const CORE_PATHS = new Set([
  "MEMORY.md",
  "memory/MANDATE.md",
  "AGENTS.md",
  "SOUL.md",
  "USER.md",
]);

const STATUS_PATHS = new Set(["INCOMPLETE.md", "projects/STATUS.md"]);

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${sizes[index]}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDailyLabel(path: string) {
  const match = path.match(/memory\/(\d{4}-\d{2}-\d{2})\.md$/);
  if (!match) return null;
  const date = new Date(match[1]);
  if (Number.isNaN(date.getTime())) return match[1];
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState("");
  const [pendingScroll, setPendingScroll] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      const res = await fetch("/api/memory", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setFiles(data.files ?? []);
    };
    loadFiles();
  }, []);

  useEffect(() => {
    if (!files.length || activePath) return;
    const memoryFile = files.find((file) => file.path === "MEMORY.md");
    setActivePath(memoryFile?.path ?? files[0]?.path ?? null);
  }, [files, activePath]);

  useEffect(() => {
    if (!activePath) return;
    const loadFile = async () => {
      setLoading(true);
      const res = await fetch(`/api/memory?file=${encodeURIComponent(activePath)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content ?? "");
      }
      setLoading(false);
    };
    loadFile();
  }, [activePath]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      setIsSearching(true);
      const res = await fetch(`/api/memory?search=${encodeURIComponent(searchQuery)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
      setIsSearching(false);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (!pendingScroll || !highlightTerm) return;
    const handle = window.setTimeout(() => {
      const target = document.querySelector("mark[data-highlight='true']");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setPendingScroll(false);
    }, 120);
    return () => window.clearTimeout(handle);
  }, [content, highlightTerm, pendingScroll]);

  const groupedFiles = useMemo(() => {
    const core: MemoryFile[] = [];
    const status: MemoryFile[] = [];
    const daily: MemoryFile[] = [];
    const other: MemoryFile[] = [];

    files.forEach((file) => {
      if (CORE_PATHS.has(file.path)) {
        core.push(file);
      } else if (STATUS_PATHS.has(file.path)) {
        status.push(file);
      } else if (/memory\/(\d{4}-\d{2}-\d{2})\.md$/.test(file.path)) {
        daily.push(file);
      } else {
        other.push(file);
      }
    });

    daily.sort((a, b) => b.path.localeCompare(a.path));

    return { core, status, daily, other };
  }, [files]);

  const activeFile = files.find((file) => file.path === activePath) ?? null;
  const dailyLabel = activeFile ? formatDailyLabel(activeFile.path) : null;

  const highlightRegex = useMemo(() => {
    if (!highlightTerm) return null;
    return new RegExp(`(${escapeRegExp(highlightTerm)})`, "gi");
  }, [highlightTerm]);

  const highlightText = (text: string) => {
    if (!highlightRegex) return text;
    const parts = text.split(highlightRegex);
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <mark
          key={`${part}-${index}`}
          data-highlight="true"
          className="rounded bg-yellow-400/40 px-1 text-yellow-100"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const renderHighlighted = (node: ReactNode): ReactNode => {
    if (!highlightRegex) return node;
    if (typeof node === "string") return highlightText(node);
    if (Array.isArray(node)) return node.map((child, index) => <span key={index}>{renderHighlighted(child)}</span>);
    if (isValidElement(node)) {
      if (node.type === "code" || node.type === "pre") return node;
      return cloneElement(node, {
        ...node.props,
        children: renderHighlighted(node.props.children),
      });
    }
    return node;
  };

  const markdownComponents = {
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="mt-6 text-3xl font-semibold text-white">{renderHighlighted(children)}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="mt-6 text-2xl font-semibold text-slate-100">{renderHighlighted(children)}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="mt-5 text-xl font-semibold text-slate-100">{renderHighlighted(children)}</h3>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mt-3 text-sm leading-7 text-slate-300">{renderHighlighted(children)}</p>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li className="ml-5 list-disc text-sm text-slate-300">{renderHighlighted(children)}</li>
    ),
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
      <a className="text-aurora-300 underline underline-offset-4" href={href}>
        {renderHighlighted(children)}
      </a>
    ),
    code: ({ inline, children }: { inline?: boolean; children?: ReactNode }) =>
      inline ? (
        <code className="rounded bg-slate-800/70 px-1 py-0.5 text-xs text-aurora-200">{children}</code>
      ) : (
        <code className="block whitespace-pre-wrap text-xs text-slate-200">{children}</code>
      ),
    pre: ({ children }: { children?: ReactNode }) => (
      <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-700/70 bg-slate-900/70 p-4 text-xs text-slate-200">
        {children}
      </pre>
    ),
    table: ({ children }: { children?: ReactNode }) => (
      <table className="mt-4 w-full border-collapse text-left text-xs text-slate-200">{children}</table>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th className="border border-slate-700/80 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-100">
        {children}
      </th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="border border-slate-700/70 px-3 py-2 text-xs text-slate-300">{children}</td>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="mt-4 border-l-2 border-aurora-500/60 pl-4 text-sm italic text-slate-300">
        {renderHighlighted(children)}
      </blockquote>
    ),
    ul: ({ children }: { children?: ReactNode }) => <ul className="mt-3 space-y-2">{children}</ul>,
    ol: ({ children }: { children?: ReactNode }) => <ol className="mt-3 space-y-2">{children}</ol>,
  };

  const handleFileSelect = (file: MemoryFile) => {
    setActivePath(file.path);
    setHighlightTerm("");
    setSearchQuery("");
    setSearchResults([]);
    setSidebarOpen(false);
  };

  const handleSearchSelect = (result: SearchResult) => {
    setActivePath(result.file);
    setHighlightTerm(searchQuery);
    setPendingScroll(true);
    setSearchResults([]);
    setSidebarOpen(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-midnight-900">
      <div className="absolute inset-0 bg-grid-fade" />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-aurora-400/80">Mission Control</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Memory</h1>
              <p className="mt-1 text-xs text-slate-400">Barry&apos;s living knowledge base and session logs.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-midnight-800/60 px-3 py-1 text-xs text-slate-300 transition hover:border-aurora-500/40 hover:text-aurora-200"
              >
                ← Command Center
              </Link>
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-midnight-800/60 px-3 py-1 text-xs text-slate-300 transition hover:border-aurora-500/40 hover:text-aurora-200 md:hidden"
              >
                Open Files
              </button>
            </div>
          </div>
          <Navigation />
        </header>

        <div className="relative grid gap-4 md:grid-cols-[280px_1fr]">
          {sidebarOpen ? (
            <button
              className="fixed inset-0 z-20 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close file browser"
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-800/70 bg-midnight-900/95 px-4 py-6 transition md:static md:w-auto md:translate-x-0 md:rounded-2xl md:border md:bg-slate-900/40 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Files</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-xs text-slate-500 transition hover:text-slate-300 md:hidden"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-4 text-xs text-slate-400">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Core</p>
                <div className="mt-2 space-y-2">
                  {groupedFiles.core.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileSelect(file)}
                      className={`flex w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                        activePath === file.path
                          ? "border-aurora-500/60 bg-aurora-500/10 text-aurora-200"
                          : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-600/70"
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-100">{file.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatBytes(file.size)} · {formatDate(file.modified)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Status</p>
                <div className="mt-2 space-y-2">
                  {groupedFiles.status.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileSelect(file)}
                      className={`flex w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                        activePath === file.path
                          ? "border-aurora-500/60 bg-aurora-500/10 text-aurora-200"
                          : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-600/70"
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-100">{file.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatBytes(file.size)} · {formatDate(file.modified)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Daily Logs</p>
                <div className="mt-2 space-y-2">
                  {groupedFiles.daily.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileSelect(file)}
                      className={`flex w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                        activePath === file.path
                          ? "border-aurora-500/60 bg-aurora-500/10 text-aurora-200"
                          : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-600/70"
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-100">{file.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatBytes(file.size)} · {formatDate(file.modified)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {groupedFiles.other.length ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Other</p>
                  <div className="mt-2 space-y-2">
                    {groupedFiles.other.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => handleFileSelect(file)}
                        className={`flex w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                          activePath === file.path
                            ? "border-aurora-500/60 bg-aurora-500/10 text-aurora-200"
                            : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-600/70"
                        }`}
                      >
                        <span className="text-sm font-medium text-slate-100">{file.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatBytes(file.size)} · {formatDate(file.modified)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <section className="glass-panel relative rounded-3xl p-6">
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Search Memory</p>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search across all memory files"
                    className="mt-2 w-full rounded-xl border border-slate-700/60 bg-midnight-800/80 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-aurora-500/60 focus:outline-none"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {isSearching ? "Searching..." : `${searchResults.length} results`}
                </div>
              </div>

              {searchResults.length ? (
                <div className="absolute left-0 right-0 z-20 mt-3 max-h-80 overflow-y-auto rounded-2xl border border-slate-700/70 bg-midnight-900/95 p-3 text-xs text-slate-300 shadow-xl">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.file}-${result.line}-${index}`}
                      onClick={() => handleSearchSelect(result)}
                      className="flex w-full flex-col gap-2 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-aurora-500/50 hover:bg-aurora-500/10"
                    >
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
                        <span>{result.file}</span>
                        <span>Line {result.line}</span>
                      </div>
                      <span className="text-sm text-slate-100">{result.preview}</span>
                      <span className="text-[10px] text-slate-400">{result.context}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-6 border-t border-slate-800/60 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {activeFile ? activeFile.name : "Select a file"}
                  </h2>
                  {dailyLabel ? <p className="mt-1 text-sm text-aurora-200">{dailyLabel}</p> : null}
                  {activeFile ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {activeFile.path} · {formatBytes(activeFile.size)} · {formatDate(activeFile.modified)}
                    </p>
                  ) : null}
                </div>
                <div className="text-[10px] text-slate-500">
                  {highlightTerm ? `Highlighting: ${highlightTerm}` : "Ready"}
                </div>
              </div>

              <div className="mt-6">
                {loading ? (
                  <p className="text-sm text-slate-400">Loading document...</p>
                ) : content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
                    components={markdownComponents}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm text-slate-400">Select a file from the sidebar.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
