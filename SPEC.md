# Mission Control Dashboard

## Overview
A dashboard for Justin to monitor Barry (AI agent) activities, scheduled tasks, and search across the workspace.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** Convex
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (later)

## Features

### 1. Activity Feed
- Real-time feed of EVERY action Barry takes
- Each entry includes:
  - Timestamp
  - Action type (research, code, message, file edit, etc.)
  - Description of what was done
  - Project/context it relates to
  - Status (success/failed/pending)
- Infinite scroll or pagination
- Filter by: date, action type, project

### 2. Calendar View
- Weekly calendar view
- Shows all scheduled tasks (cron jobs, reminders, heartbeats)
- Visual representation of:
  - 1am: Nightly Amazement Build
  - 3am: Strategic Review
  - 6am: Morning Briefing
  - Heartbeats every 30 min (8am-9pm)
- Click on task to see details
- Nicely formatted, clean UI

### 3. Global Search
- Single search box
- Searches across:
  - Memory files (MEMORY.md, memory/*.md)
  - Project files (projects/*)
  - Documents in workspace
  - Activity logs
  - Scheduled tasks
- Returns ranked results with snippets
- Click to expand/navigate

## Data Schema (Convex)

### activities
- id
- timestamp
- actionType: string (research, code, message, file, deploy, etc.)
- description: string
- project: string (optional)
- status: "success" | "failed" | "pending"
- metadata: object (flexible for extra data)

### scheduledTasks
- id
- name: string
- cronExpression: string
- nextRun: timestamp
- lastRun: timestamp (optional)
- description: string
- enabled: boolean

### searchIndex
- id
- source: string (memory, project, document, activity)
- path: string
- content: string
- updatedAt: timestamp

## Pages

1. `/` - Main dashboard with activity feed
2. `/calendar` - Weekly calendar view
3. `/search` - Global search page
4. API routes for ingesting new activities

## API Integration
- POST /api/activity - Log new activity (Barry calls this)
- GET /api/activities - Fetch activities (with filters)
- GET /api/schedule - Get scheduled tasks
- GET /api/search - Search endpoint

## Design
- Dark mode by default
- Clean, minimal UI
- Responsive (works on mobile)
- Real-time updates where possible

## Priority
Build in this order:
1. Activity Feed (core feature)
2. Calendar View
3. Global Search
