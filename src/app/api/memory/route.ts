import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEMORY_FILE = path.join("/tmp", "mission-control-memory.json");
const AUTH_TOKEN = process.env.MC_AUTH_TOKEN || "barry-update-2026";

interface StoredMemory {
  timestamp: string;
  files: {
    name: string;
    path: string;
    size: number;
    modified: string;
    content: string;
  }[];
}

function readMemory(): StoredMemory | null {
  try {
    const data = fs.readFileSync(MEMORY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeMemory(data: StoredMemory): boolean {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Error writing memory:", e);
    return false;
  }
}

function isSafePath(requestedPath: string) {
  if (!requestedPath) return false;
  if (requestedPath.includes("..")) return false;
  if (path.isAbsolute(requestedPath)) return false;
  if (!requestedPath.toLowerCase().endsWith(".md")) return false;
  return true;
}

export async function GET(request: Request) {
  const memory = readMemory();

  if (!memory || !memory.files?.length) {
    return NextResponse.json({
      error: "No memory data yet. Waiting for Barry to push an update.",
    });
  }

  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");
  const search = searchParams.get("search");

  // Search across all files
  if (search) {
    const needle = search.toLowerCase();
    const results: { file: string; line: number; preview: string; context: string }[] = [];

    for (const f of memory.files) {
      const lines = f.content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].toLowerCase().includes(needle)) continue;
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length - 1, i + 1);
        const context = lines.slice(start, end + 1).join("\n").trim();
        results.push({
          file: f.path,
          line: i + 1,
          preview: lines[i].trim(),
          context,
        });
        if (results.length >= 200) break;
      }
      if (results.length >= 200) break;
    }

    return NextResponse.json({ query: search, count: results.length, results });
  }

  // Return specific file content
  if (file) {
    if (!isSafePath(file)) {
      return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
    }
    const found = memory.files.find((f) => f.path === file);
    if (!found) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }
    return NextResponse.json({
      file: found.path,
      name: found.name,
      size: found.size,
      modified: found.modified,
      content: found.content,
    });
  }

  // List all files (without content for smaller payload)
  const files = memory.files.map((f) => ({
    name: f.name,
    path: f.path,
    size: f.size,
    modified: f.modified,
  }));

  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== AUTH_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body.files)) {
      return NextResponse.json({ error: "Expected { files: [...] }" }, { status: 400 });
    }

    const data: StoredMemory = {
      timestamp: new Date().toISOString(),
      files: body.files,
    };

    if (writeMemory(data)) {
      return NextResponse.json({
        success: true,
        timestamp: data.timestamp,
        fileCount: data.files.length,
      });
    } else {
      return NextResponse.json({ error: "Failed to store memory" }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
