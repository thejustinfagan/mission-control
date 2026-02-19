import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKSPACE_ROOT = "/Users/justinfagan/.openclaw/workspace";

interface MemoryFileMeta {
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

async function walkMarkdownFiles(dir: string, root: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkMarkdownFiles(fullPath, root);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(path.relative(root, fullPath));
    }
  }

  return files;
}

function isSafePath(requestedPath: string) {
  if (!requestedPath) return false;
  if (requestedPath.includes("..")) return false;
  if (path.isAbsolute(requestedPath)) return false;
  if (!requestedPath.toLowerCase().endsWith(".md")) return false;
  return true;
}

async function listFiles(): Promise<MemoryFileMeta[]> {
  const filePaths = await walkMarkdownFiles(WORKSPACE_ROOT, WORKSPACE_ROOT);
  const files: MemoryFileMeta[] = [];

  for (const filePath of filePaths) {
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    const stats = await fs.stat(fullPath);
    files.push({
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function searchFiles(query: string): Promise<SearchResult[]> {
  const filePaths = await walkMarkdownFiles(WORKSPACE_ROOT, WORKSPACE_ROOT);
  const results: SearchResult[] = [];
  const needle = query.toLowerCase();

  for (const filePath of filePaths) {
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    const content = await fs.readFile(fullPath, "utf8");
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      if (!lines[i].toLowerCase().includes(needle)) continue;
      const start = Math.max(0, i - 1);
      const end = Math.min(lines.length - 1, i + 1);
      const context = lines.slice(start, end + 1).join("\n").trim();
      results.push({
        file: filePath,
        line: i + 1,
        preview: lines[i].trim(),
        context,
      });
      if (results.length >= 200) return results;
    }
  }

  return results;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");
    const search = searchParams.get("search");

    if (search) {
      const results = await searchFiles(search);
      return NextResponse.json({ query: search, count: results.length, results });
    }

    if (file) {
      if (!isSafePath(file)) {
        return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
      }
      const fullPath = path.resolve(WORKSPACE_ROOT, file);
      if (!fullPath.startsWith(path.resolve(WORKSPACE_ROOT))) {
        return NextResponse.json({ error: "Path traversal blocked." }, { status: 400 });
      }

      const content = await fs.readFile(fullPath, "utf8");
      const stats = await fs.stat(fullPath);
      return NextResponse.json({
        file,
        name: path.basename(file),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        content,
      });
    }

    const files = await listFiles();
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: "Unable to read memory files." }, { status: 500 });
  }
}
