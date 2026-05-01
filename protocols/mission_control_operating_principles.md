# Mission Control Operating Principles

## Purpose

Mission Control is the central operating surface for Justin's multi-lane AI operating system. It is not merely a project manager, spreadsheet, report, or chat summary.

Mission Control exists so Justin can go to one place at any time and perform project-management, strategy, content, code, marketing, monetization, and AI-architecture steering activities across all active efforts.

## Core Problem

Previous mission controls and project managers failed because they became stale, required manual upkeep, and did a poor job tracking actual work. They became another chore for Justin instead of reducing his burden.

Mission Control must not depend on Justin manually updating everything.

## Core Rule

If an agent does work, the agent updates Mission Control.

If the agent cannot update Mission Control, the work is not complete.

## What Makes It Fantastic

Mission Control must be maintained by the work itself, not by Justin's discipline.

It should provide:

1. Auto-capture
   - Capture tasks, ideas, experiments, decisions, code changes, strategy work, content work, monetization hypotheses, and next actions as work happens.

2. Auto-sweep
   - Nightly canonical review across codebases, project files, reports, stale items, strategy gaps, marketing gaps, and monetization paths.

3. Auto-summarize
   - Produce a clean daily executive view rather than raw chaos.

4. Auto-escalate
   - Clearly identify what needs Justin's decision versus what agents can continue moving forward.

5. Auto-improve
   - Critique the operating system itself: what is slowing us down, what process failed, what should change, and how Justin can become a better AI architect.

## Source of Truth vs. Review Surface

Mission Control should separate canonical records from review surfaces.

Canonical records should live in durable, tool-agnostic formats such as GitHub markdown, YAML, JSON, and eventually database-backed state where needed.

Review surfaces may include:
- mobile web dashboards
- Google Sheets
- Google Docs
- HTML reports
- PDFs
- ChatGPT summaries
- Claude summaries
- daily or weekly reports

Google Sheets, Docs, HTML, and chat responses are review surfaces unless explicitly designated as canonical.

## Mobile Requirement

Mission Control must be stupid-easy on iPhone.

Justin should be able to:
- add tasks quickly,
- change deadlines,
- drag/drop or reprioritize work,
- group efforts into initiatives,
- review agent progress,
- approve/kill/defer items,
- view nightly sweeps,
- and steer work without needing local Mac Mini access.

## Scope

Mission Control must track more than code.

It must include:
- codebases,
- coding projects,
- content development,
- strategy development,
- marketing development,
- monetization hypotheses,
- thought-leadership efforts,
- experiments,
- UAT/review packets,
- cleanup items,
- SOP updates,
- agent performance,
- and AI-architecture improvement.

## Nightly Canonical Sweep

A recurring agent sweep should review active repos and project context and produce feedback on:
- code health,
- project progress,
- next steps,
- proposals,
- risks,
- content opportunities,
- strategy gaps,
- marketing direction,
- monetization path,
- thought-leadership potential,
- cleanup needs,
- stale work,
- what should be promoted,
- what should be paused,
- what should be killed,
- and how Justin and the agents are working together.

## Success Standard

Mission Control is successful only if Justin can open it and immediately know:

- What is moving?
- What is stuck?
- What needs Justin?
- What made progress without Justin?
- What can make money?
- What builds thought leadership?
- What should be killed?
- What did the agents learn?
- How is the operating system improving?

## Design Principle

Mission Control should not ask Justin to manage the system.

It should show Justin where to steer.

## Where This Belongs

This file belongs in the canonical Mission Control repo as a protocol / architecture note.

A short pointer belongs in `aboutme.md`, but the full specification belongs here and in related Mission Control project-management protocols.
