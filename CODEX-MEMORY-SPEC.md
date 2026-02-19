# Codex Task: Build Memory Viewer for Mission Control

## Goal
Add a memory page that displays all of Barry's memory files as beautiful rendered documents, with full-text search.

## Memory Files Location
Barry's workspace: `/Users/justinfagan/.openclaw/workspace/`

Key files:
- `MEMORY.md` — long-term strategic knowledge
- `memory/MANDATE.md` — core directives
- `memory/YYYY-MM-DD.md` — daily session logs (one per day)
- `INCOMPLETE.md` — active incomplete work
- `projects/STATUS.md` — project status tracker
- `AGENTS.md` — operating manual
- `SOUL.md` — personality/identity
- `USER.md` — about Justin

## Data Source

### API: `src/app/api/memory/route.ts`
- `GET /api/memory` — list all memory files with metadata (name, path, size, modified date)
- `GET /api/memory?file=MEMORY.md` — return rendered content of a specific file
- `GET /api/memory?search=polymarket` — full-text search across all files, return matching snippets with file + line numbers

Implementation: Use `fs` to read files from the workspace directory. Parse markdown to extract sections. For search, do simple case-insensitive substring matching across all .md files, returning context lines around matches.

### Security
- Only serve .md files from the workspace directory
- No path traversal (reject paths with `..`)
- Read-only (no writes from the UI)

## UI Components

### Page: `src/app/memory/page.tsx`

### Layout
1. **Left sidebar** — file browser
   - Tree view of memory files grouped by type:
     - 📚 Core (MEMORY.md, MANDATE.md, AGENTS.md, SOUL.md, USER.md)
     - 📋 Status (INCOMPLETE.md, projects/STATUS.md)
     - 📅 Daily Logs (memory/YYYY-MM-DD.md, sorted newest first)
   - Click to load file in main panel
   - Show file size and last modified date

2. **Top bar** — search
   - Search input with debounce (300ms)
   - Results appear as a dropdown/overlay
   - Each result shows: file name, matching line, context snippet
   - Click result to open that file and scroll to the match
   - Show result count

3. **Main panel** — document viewer
   - Rendered markdown (headings, lists, bold, code blocks, tables)
   - Use a markdown renderer (remark/rehype or similar — check what's already installed)
   - If nothing installed, use a simple regex-based renderer or install `react-markdown`
   - Beautiful typography on dark background
   - Section headers are linkable/bookmarkable
   - Code blocks have syntax highlighting (or at minimum monospace + background)

### Styling
- Dark mode matching existing Mission Control theme
- Documents should feel like reading a well-formatted wiki
- Daily logs should show the date prominently as a header
- Highlight search terms in yellow when navigating from search results
- Mobile: sidebar collapses to hamburger menu, full-width document view

### Navigation
- Add "Memory" link to navigation (after Calendar)

## Acceptance Criteria
- Memory page renders at /memory
- All .md files from workspace are listed in sidebar
- Clicking a file renders it as formatted markdown
- Search works across all files with context snippets
- Daily logs sorted newest-first
- Mobile responsive (sidebar collapses)
- `npm run build` passes
- Navigation includes Memory link
