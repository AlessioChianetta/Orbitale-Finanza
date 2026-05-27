-- Enforce one budget_settings row per user.
-- Required for the atomic upsert (INSERT ... ON CONFLICT (user_id) DO UPDATE)
-- in storage.upsertBudgetSettings, which would otherwise race under concurrent writes.
ALTER TABLE "budget_settings"
  ADD CONSTRAINT "budget_settings_user_id_unique" UNIQUE ("user_id");
