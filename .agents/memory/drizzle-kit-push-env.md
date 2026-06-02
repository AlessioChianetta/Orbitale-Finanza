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

**Also commit a migration for reproducibility.** This repo's `migrations/` does NOT keep a meta
snapshot per migration — only `meta/0000_snapshot.json` exists, and later migrations (0002, 0003,
...) are hand-written `NNNN_name.sql` files plus a matching entry appended to
`meta/_journal.json`. Follow that same pattern: write idempotent `CREATE TABLE IF NOT EXISTS ...`
SQL and add the journal entry. Do NOT run `drizzle-kit generate` here — the incomplete meta would
produce a huge/wrong diff.
