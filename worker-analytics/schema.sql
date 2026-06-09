CREATE TABLE IF NOT EXISTS events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ts       INTEGER NOT NULL,
  type     TEXT    NOT NULL,
  target   TEXT,
  category TEXT,
  source   TEXT,
  lang     TEXT,
  view     TEXT,
  sid      TEXT,
  ref      TEXT,
  ua       TEXT,
  ver      TEXT,
  detail   TEXT,
  client   TEXT,
  os       TEXT,
  iid      TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_type   ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_ts     ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_target ON events(target);
CREATE INDEX IF NOT EXISTS idx_events_iid    ON events(iid);
