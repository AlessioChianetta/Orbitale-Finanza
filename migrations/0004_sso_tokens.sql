-- Single-use, short-lived SSO tokens for partner auto-login (server-to-server).
-- Only a SHA-256 hash of the token is stored (token_hash), never the raw token,
-- so a leak of this table cannot be used to log in. Tokens are consumed
-- (consumed_at set) on first valid use and rejected after expiry.
CREATE TABLE IF NOT EXISTS "sso_tokens" (
  "id" serial PRIMARY KEY,
  "token_hash" varchar(64) NOT NULL,
  "user_id" integer NOT NULL,
  "email" varchar(255) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "sso_tokens_token_hash_unique" UNIQUE ("token_hash"),
  CONSTRAINT "sso_tokens_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

CREATE INDEX IF NOT EXISTS "sso_tokens_expires_at_idx"
  ON "sso_tokens" ("expires_at");
