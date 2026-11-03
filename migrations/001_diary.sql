CREATE TYPE diary_request_status AS ENUM ('running','complete','failed');
CREATE TABLE diary_vaults (
 user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 salt text NOT NULL CHECK (length(salt) BETWEEN 20 AND 100),
 key_check jsonb NOT NULL,
 profile_cipher jsonb NOT NULL,
 kdf_iterations integer NOT NULL DEFAULT 600000 CHECK (kdf_iterations = 600000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE diary_entries (
 id uuid PRIMARY KEY,
 user_id integer NOT NULL REFERENCES diary_vaults(user_id) ON DELETE CASCADE,
 cipher jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX diary_entries_owner_updated ON diary_entries(user_id, updated_at DESC);
CREATE TABLE diary_council_requests (
 id uuid PRIMARY KEY,
 user_id integer NOT NULL REFERENCES diary_vaults(user_id) ON DELETE CASCADE,
 entry_id uuid NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
 status diary_request_status NOT NULL DEFAULT 'running',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX diary_one_running_council ON diary_council_requests(user_id) WHERE status = 'running';
CREATE INDEX diary_council_rate ON diary_council_requests(user_id, created_at DESC);
