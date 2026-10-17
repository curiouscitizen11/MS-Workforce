-- Portal cache. Run this once in the Neon SQL editor.
-- It does not store ticket photos. Those go in private Blob storage.

CREATE TABLE IF NOT EXISTS portal_records (
  collection text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL,
  PRIMARY KEY (collection, id)
);
