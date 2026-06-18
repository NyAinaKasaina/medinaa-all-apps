-- Migration 010: table analytics_events (landing analytics beacon)
-- Idempotent: CREATE TABLE IF NOT EXISTS + safe index creation

CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR NOT NULL,
  locale     VARCHAR,
  path       VARCHAR,
  device     VARCHAR,
  referrer   VARCHAR,
  meta       JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name       ON analytics_events (name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at DESC);
