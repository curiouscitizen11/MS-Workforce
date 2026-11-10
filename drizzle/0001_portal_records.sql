-- Portal cache.
-- The live portal creates this table on its first request.
-- You can also run: npm run portal:migrate
-- It does not store ticket photos. Those go in private Blob storage, or in this table only when Blob is not set.

CREATE TABLE IF NOT EXISTS portal_records (
  collection text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL,
  PRIMARY KEY (collection, id)
);
