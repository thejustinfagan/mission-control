#!/usr/bin/env python3
"""Generate schedule JSON from OpenClaw cron jobs for Mission Control."""
import json, os, subprocess, datetime

CRON_STATE = os.path.expanduser("~/.openclaw/cron/jobs.json")

CATEGORY_MAP = {
    "amazement": "build",
    "briefing": "briefing",
    "morning": "briefing",
    "fleet": "maintenance",
    "enrichment": "maintenance",
    "battle": "maintenance",
    "health": "maintenance",
    "status": "maintenance",
    "tracker": "maintenance",
    "polymarket": "polymarket",
    "strategic": "research",
    "research": "research",
    "qa": "build",
    "whiteboard": "build",
}

def guess_category(name):
    name_lower = name.lower()
    for key, cat in CATEGORY_MAP.items():
        if key in name_lower:
            return cat
    return "maintenance"

def format_schedule(schedule):
    kind = schedule.get("kind", "")
    if kind == "cron":
        expr = schedule.get("expr", "")
        tz = schedule.get("tz", "UTC")
        return f"Cron: {expr} ({tz})"
    elif kind == "every":
        ms = schedule.get("everyMs", 0)
        return f"Every {ms // 60000}m"
    elif kind == "at":
        return f"At {schedule.get('at', '?')}"
    return str(schedule)

def main():
    # Try reading from OpenClaw state directly
    jobs_data = None
    if os.path.isfile(CRON_STATE):
        try:
            with open(CRON_STATE) as f:
                jobs_data = json.load(f)
        except:
            pass

    if not jobs_data:
        # Fallback: empty
        print(json.dumps([]))
        return

    jobs = jobs_data if isinstance(jobs_data, list) else jobs_data.get("jobs", [])
    schedule = []

    for job in jobs:
        name = job.get("name", "Unnamed")
        sched = job.get("schedule", {})
        state = job.get("state", {})
        enabled = job.get("enabled", True)

        entry = {
            "id": job.get("id", ""),
            "name": name,
            "schedule": format_schedule(sched),
            "cronExpr": sched.get("expr", "* * * * *"),
            "timezone": sched.get("tz", "America/Chicago"),
            "enabled": enabled,
            "category": guess_category(name),
            "description": job.get("payload", {}).get("message", "")[:200] + "..." if len(job.get("payload", {}).get("message", "")) > 200 else job.get("payload", {}).get("message", ""),
        }

        if state.get("lastStatus"):
            entry["lastStatus"] = "ok" if state["lastStatus"] == "ok" else "error"
        if state.get("lastError"):
            entry["lastError"] = state["lastError"][:300]
        if state.get("lastRunAtMs"):
            entry["lastRun"] = datetime.datetime.fromtimestamp(
                state["lastRunAtMs"] / 1000, tz=datetime.timezone.utc
            ).isoformat()
        if state.get("nextRunAtMs"):
            entry["nextRun"] = datetime.datetime.fromtimestamp(
                state["nextRunAtMs"] / 1000, tz=datetime.timezone.utc
            ).isoformat()

        schedule.append(entry)

    print(json.dumps(schedule))

if __name__ == "__main__":
    main()
