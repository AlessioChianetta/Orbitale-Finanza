-- Per-key audit log of every request to /api/public/*.
-- Captures auth failures (statusCode 401/403/404) and successful calls.
-- Never stores the raw API key — only a short fingerprint.
CREATE TABLE IF NOT EXISTS "public_api_call_logs" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "api_key_fingerprint" varchar(32),
  "user_email" varchar(255),
  "user_id" integer,
  "method" varchar(8) NOT NULL,
  "path" varchar(512) NOT NULL,
  "query" text,
  "status_code" integer NOT NULL,
  "duration_ms" integer NOT NULL,
  "ip" varchar(64),
  "user_agent" varchar(512),
  "error_message" text
);

CREATE INDEX IF NOT EXISTS "public_api_call_logs_created_at_idx"
  ON "public_api_call_logs" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "public_api_call_logs_user_email_idx"
  ON "public_api_call_logs" ("user_email");

CREATE INDEX IF NOT EXISTS "public_api_call_logs_api_key_fingerprint_idx"
  ON "public_api_call_logs" ("api_key_fingerprint");
