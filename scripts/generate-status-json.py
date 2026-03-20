#!/usr/bin/env python3
"""Generate live status JSON from git repos for Mission Control."""
import json, os, subprocess, datetime

PROJECTS_DIR = os.path.expanduser("~/projects")
WORKSPACE = os.path.expanduser("~/.openclaw/workspace")

def run_git(repo_path, *args, timeout=5):
    try:
        r = subprocess.run(["git"] + list(args), cwd=repo_path,
                          capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip() if r.returncode == 0 else None
    except:
        return None

def scan_repo(name, path):
    """Scan a single git repo for project status."""
    branch = run_git(path, "branch", "--show-current")
    last_commit_date = run_git(path, "log", "-1", "--format=%aI")
    last_commit_msg = run_git(path, "log", "-1", "--format=%s")
    commit_count_7d = run_git(path, "rev-list", "--count", "--since=7 days ago", "HEAD")
    dirty = run_git(path, "status", "--porcelain")
    remote_url = run_git(path, "remote", "get-url", "origin")

    # Determine staleness
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    stage = "development"
    days_since = None
    if last_commit_date:
        try:
            lc = datetime.datetime.fromisoformat(last_commit_date)
            days_since = (now - lc).days
            if days_since > 30:
                stage = "archived"
            elif days_since > 14:
                stage = "planning"
            elif days_since > 7:
                stage = "research"
            else:
                stage = "development"
        except:
            pass

    # Check for key indicators
    has_package_json = os.path.isfile(os.path.join(path, "package.json"))
    has_readme = os.path.isfile(os.path.join(path, "README.md"))
    has_dockerfile = os.path.isfile(os.path.join(path, "Dockerfile"))

    # Detect live URLs from common deploy configs
    live_url = None
    if os.path.isfile(os.path.join(path, "vercel.json")):
        live_url = f"https://{name}.vercel.app"
    elif os.path.isfile(os.path.join(path, "railway.json")) or os.path.isfile(os.path.join(path, "railway.toml")):
        live_url = f"(Railway deployed)"

    repo_url = None
    if remote_url and "github.com" in (remote_url or ""):
        repo_url = remote_url.replace(".git", "")

    return {
        "id": name.lower().replace("_", "-").replace(" ", "-"),
        "name": name,
        "branch": branch or "unknown",
        "lastCommit": last_commit_date,
        "lastCommitMessage": last_commit_msg,
        "commitsLast7d": int(commit_count_7d) if commit_count_7d else 0,
        "dirty": bool(dirty),
        "stage": stage,
        "daysSinceCommit": days_since,
        "hasPackageJson": has_package_json,
        "hasReadme": has_readme,
        "hasDockerfile": has_dockerfile,
        "liveUrl": live_url,
        "repoUrl": repo_url,
        "localPath": path,
    }

def main():
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    projects = []
    active = 0
    stale = 0
    blocked = 0

    if os.path.isdir(PROJECTS_DIR):
        for name in sorted(os.listdir(PROJECTS_DIR)):
            path = os.path.join(PROJECTS_DIR, name)
            if not os.path.isdir(os.path.join(path, ".git")):
                continue
            try:
                info = scan_repo(name, path)
                projects.append(info)
                if info["commitsLast7d"] > 0:
                    active += 1
                elif info["stage"] == "archived":
                    stale += 1
            except:
                continue

    # Sort: active first (by commits), then by date
    projects.sort(key=lambda p: (-p["commitsLast7d"], p.get("daysSinceCommit") or 999))

    payload = {
        "timestamp": now.isoformat(),
        "summary": {
            "totalProjects": len(projects),
            "activeProjects": active,
            "staleProjects": stale,
            "blockedProjects": blocked,
            "decisionsNeeded": 0,
            "incompleteItems": 0,
        },
        "projects": projects,
    }
    print(json.dumps(payload))

if __name__ == "__main__":
    main()
