---
name: planning
description: Create a plan for a new task or feature in this project. Produces a planning document in docs/planning/ — research first, then codebase inspection, then a written plan. No code changes. Use whenever the user asks to plan, design, or think through a task before implementing it.
---

# Planning

This skill defines how plans are created for new tasks in this project.

> **No code changes.** A planning session produces only an `.md` file in `docs/planning/`.

---

## Step 1 — Internet Research

Before touching the codebase, research the problem externally.

**a. General search**
Search for existing alternatives, libraries, or prior art for the task.

**b. Inspiration**
Find implementations of similar things online. Use them as inspiration for the approach — do not copy, but let them inform the design.

---

## Step 2 — Project Inspection

After research, read the codebase and understand the integration surface:

- Read `AGENTS.md` for conventions, constraints, and existing patterns.
- Identify the files and modules the task touches.
- Check for existing utilities or abstractions that can be reused.
- Note any production-safety concerns (active bots, shared infra, partner config).

---

## Step 3 — Write the Plan

Save the plan to `docs/planning/<task-name>.md`.

Use the structure below. Include only the sections that are relevant — omit sections that add no value for the specific task.

### Plan Structure

```markdown
# [Feature / Task Name]

## Status: Planning

## Problem
What is broken, missing, or not possible today?
Use bullet questions if helpful — what can't we answer? what can't we do?

## Goal
One sentence: what does success look like?

## Why
- **[Reason]**: explanation
- **[Reason]**: explanation

## Approach
High-level description of the solution.

### [Sub-component or decision]
Details, rationale, code snippets, or schema tables as needed.

## Implementation

### Phase 1: [Name]
1. Step
2. Step

### Phase 2: [Name]
1. Step
2. Step

## Scope
What this plan explicitly does NOT do.

## Notes
Rollback strategy, zero-downtime considerations, partner-config impact, etc.
```

---

## Rules

- **Simple language.** Write for a reader who hasn't seen this codebase before.
- **Short sections.** Each section should be as long as needed — no longer.
- **No implementation.** The plan describes the approach. Code comes later.
- **Honest scope.** Call out what is out of scope. Call out open questions rather than hiding them.
- **Production awareness.** Note any risk to active bots, shared infra, or partner config.
