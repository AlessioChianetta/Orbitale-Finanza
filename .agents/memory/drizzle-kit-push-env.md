---
name: drizzle-kit push hangs in this environment
description: db:push blocks on an interactive prompt; how to apply schema changes reliably here
---

`npm run db:push` (drizzle-kit push) hangs and gets killed (exit -1, no output) in this
workspace, even with `--force` or piped stdin. It appears to wait on an interactive TTY prompt.

**Why:** the Supabase-hosted Postgres + drizzle-kit combo prompts for confirmation that the
non-interactive shell cannot answer, so the command never returns.

**How to apply:** for additive schema changes, create the table/column directly with SQL via a
short `node -e` script using `pg` and `process.env.DATABASE_URL`, writing DDL that matches the
Drizzle table definition exactly (same names, types, constraints). Then verify with
`select to_regclass('public.<table>')`. This keeps future drizzle diffs clean.
