#!/bin/bash
# scan-and-push.sh — Scan all ~/projects/ repos and push live status to Mission Control
# Run: bash scripts/scan-and-push.sh
set -euo pipefail

PROJECTS_DIR="$HOME/projects"
MC_URL="${MC_URL:-https://mission-control-rose-xi.vercel.app}"
MC_TOKEN="${MC_TOKEN:-barry-update-2026}"

now_iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Collect project data
python3 - "$PROJECTS_DIR" "$MC_URL" "$MC_TOKEN" "$now_iso" << 'PYEOF'
import os, sys, json, subprocess, urllib.request, urllib.error
from datetime import datetime, timezone

projects_dir = sys.argv[1]
mc_url = sys.argv[2]
mc_token = sys.argv[3]
now_iso = sys.argv[4]

def run(cmd, cwd=None, timeout=5):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd, timeout=timeout)
        return r.stdout.strip() if r.returncode == 0 else ""
    except:
        return ""

def check_deploy(url, timeout=8):
    try:
        req = urllib.request.Request(url, method="HEAD")
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status < 400
    except:
        return False

# Known project metadata
KNOWN = {
    "Battle_Dinghy": {"emoji": "⛵", "desc": "Multi-game X/Twitter bot", "deploy": "https://battledinghy-production-13ab.up.railway.app/", "priority": 1},
    "mission-control": {"emoji": "🎛️", "desc": "Dashboard for monitoring Barry activities & projects", "deploy": "https://mission-control-rose-xi.vercel.app", "priority": 2},
    "x-simulator-v2": {"emoji": "🧪", "desc": "QA staging for game bot threads", "priority": 3},
    "fleet-intel": {"emoji": "🚛", "desc": "FMCSA carrier intelligence", "deploy": "https://fleetintel.net", "priority": 3},
    "polymarket-bot": {"emoji": "📊", "desc": "Whale tracker + daily intel for Polymarket", "priority": 4},
    "polymarket-dashboard": {"emoji": "📈", "desc": "Polymarket strategy dashboard", "priority": 5},
    "beast-mode": {"emoji": "🦁", "desc": "Infrastructure audit system", "priority": 8},
    "reseller-intel": {"emoji": "🏪", "desc": "Auto reseller scraping and intelligence", "deploy": "https://reseller-intel.vercel.app", "priority": 6},
    "vin-intelligence": {"emoji": "🔍", "desc": "Vehicle identification number lookup", "priority": 7},
    "territory-command-center": {"emoji": "🗺️", "desc": "Territory management dashboard", "priority": 5},
    "fleet-intel-briefing": {"emoji": "📋", "desc": "Fleet Intel daily briefing bot", "priority": 4},
    "dc-land-intel": {"emoji": "🏠", "desc": "DC land intelligence tool", "deploy": "https://dc-land-intel.vercel.app", "priority": 6},
    "ai-whiteboard": {"emoji": "🎨", "desc": "AI Whiteboard — sketch to spec", "priority": 3},
    "threadchess": {"emoji": "♟️", "desc": "Chess thread game engine", "priority": 7},
    "FleetPulse": {"emoji": "📡", "desc": "Fleet monitoring pulse", "priority": 8},
    "california-electrician-reminders": {"emoji": "⚡", "desc": "CA electrician license reminders", "priority": 9},
    "florida-license-reminders": {"emoji": "🌴", "desc": "FL license reminders", "priority": 9},
    "texas-license-reminders": {"emoji": "🤠", "desc": "TX license reminders", "priority": 9},
    "swipenft": {"emoji": "💎", "desc": "Tinder for NFTs", "priority": 9},
    "wife-calendar": {"emoji": "📅", "desc": "Calendar OCR tool", "priority": 8},
    "openclaw": {"emoji": "🦞", "desc": "OpenClaw CLI agent framework", "priority": 5},
    "aftermarket-intel": {"emoji": "🔧", "desc": "Truck aftermarket vendor scraper", "priority": 7},
}

projects = []
now = datetime.now(timezone.utc)

for d in sorted(os.listdir(projects_dir)):
    full = os.path.join(projects_dir, d)
    if not os.path.isdir(full) or d.startswith('.'):
        continue
    
    git_dir = os.path.join(full, '.git')
    if not os.path.isdir(git_dir):
        continue
    
    # Check if readable
    test = run(f"git log --oneline -1", cwd=full)
    if not test:
        continue
    
    meta = KNOWN.get(d, {"emoji": "📁", "desc": d, "priority": 10})
    
    # Git info
    last_commit = run("git log -1 --format='%aI'", cwd=full)
    last_msg = run("git log -1 --format='%s'", cwd=full)
    branch = run("git rev-parse --abbrev-ref HEAD", cwd=full)
    commit_count = run("git rev-list --count HEAD", cwd=full) or "0"
    
    # Calculate days since last touch
    days_since = 999
    if last_commit:
        try:
            lc = datetime.fromisoformat(last_commit.replace("'", ""))
            days_since = (now - lc).days
        except:
            pass
    
    # Determine status
    status = "active"
    if days_since >= 14:
        status = "stale"
    elif days_since >= 7:
        status = "inactive"
    
    # Check deploy health
    deploy_url = meta.get("deploy", "")
    deploy_healthy = None
    if deploy_url:
        deploy_healthy = check_deploy(deploy_url)
    
    health = "healthy"
    if deploy_url and deploy_healthy is False:
        health = "degraded"
    
    # Has package.json?
    has_pkg = os.path.isfile(os.path.join(full, "package.json"))
    
    proj = {
        "name": d,
        "emoji": meta["emoji"],
        "status": status,
        "priority": meta["priority"],
        "lastWorked": last_commit.replace("'", "") if last_commit else "",
        "currentMilestone": last_msg.replace("'", "") if last_msg else "",
        "nextAction": "",
        "blockers": "",
        "daysSinceTouch": days_since,
        "needsDecision": "no",
        "liveUrl": deploy_url,
        "data": f"{commit_count} commits | branch: {branch}",
        "features": [],
        "description": meta["desc"],
        "health": health,
        "deployHealthy": deploy_healthy,
    }
    projects.append(proj)

# Sort by priority
projects.sort(key=lambda p: p["priority"])

# Summary stats
active = sum(1 for p in projects if p["status"] == "active")
blocked = sum(1 for p in projects if p.get("health") == "degraded")
stale = sum(1 for p in projects if p["status"] == "stale")
total = len(projects)

# Read today's log
today_log = None
today = datetime.now().strftime("%Y-%m-%d")
log_path = os.path.expanduser(f"~/.openclaw/workspace/memory/{today}.md")
if os.path.isfile(log_path):
    try:
        with open(log_path) as f:
            today_log = f.read()[:3000]
    except:
        pass

# Build incomplete items from INCOMPLETE.md
incomplete = []
inc_path = os.path.expanduser("~/.openclaw/workspace/INCOMPLETE.md")
if os.path.isfile(inc_path):
    try:
        with open(inc_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("- **") and ":**" in line:
                    task = line.lstrip("- ")
                    completed = line.startswith("- **✅")
                    proj_name = task.split(":**")[0].replace("**", "").replace("✅ ", "")
                    task_desc = task.split(":**")[1].strip() if ":**" in task else task
                    incomplete.append({"project": proj_name, "completed": completed, "task": task_desc})
    except:
        pass

payload = {
    "timestamp": now_iso,
    "summary": {
        "totalProjects": total,
        "activeProjects": active,
        "blockedProjects": blocked,
        "staleProjects": stale,
        "decisionsNeeded": 0,
        "incompleteItems": sum(1 for i in incomplete if not i["completed"]),
    },
    "projects": projects,
    "incomplete": incomplete,
    "todayLog": today_log,
}

# Push to Mission Control
data = json.dumps(payload).encode()
req = urllib.request.Request(
    f"{mc_url}/api/status",
    data=data,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {mc_token}",
    },
    method="POST",
)

try:
    resp = urllib.request.urlopen(req, timeout=15)
    result = json.loads(resp.read())
    print(f"✅ Pushed {total} projects to Mission Control")
    print(f"   Active: {active} | Stale: {stale} | Degraded: {blocked}")
    print(f"   Response: {result}")
except urllib.error.HTTPError as e:
    print(f"❌ HTTP {e.code}: {e.read().decode()}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

# Also save locally
local_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "latest-status.json")
os.makedirs(os.path.dirname(local_path), exist_ok=True)
with open(local_path, "w") as f:
    json.dump(payload, f, indent=2)
print(f"   Saved local copy: {local_path}")
PYEOF
