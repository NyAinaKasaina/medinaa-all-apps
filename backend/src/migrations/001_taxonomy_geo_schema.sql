-- 001 — Schéma taxonomie médicale + hiérarchie géographique (idempotent)
-- Réorg du 2026-06-13. Additif : aucune colonne/table existante n'est supprimée.

BEGIN;

-- ── Taxonomie ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_categories (
  slug        varchar PRIMARY KEY,
  label_fr    varchar NOT NULL,
  label_mg    varchar,
  label_en    varchar,
  sort_order  smallint NOT NULL DEFAULT 0,
  color       varchar,
  icon        varchar
);

CREATE TABLE IF NOT EXISTS medical_types (
  slug          varchar PRIMARY KEY,
  category_slug varchar NOT NULL REFERENCES medical_categories(slug) ON UPDATE CASCADE,
  label_fr      varchar NOT NULL,
  label_mg      varchar,
  label_en      varchar,
  description   varchar,
  sort_order    smallint NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_medical_types_category ON medical_types (category_slug);

-- ── Géographie (Région > District > Commune > Fokontany) ─────────────────────
CREATE TABLE IF NOT EXISTS regions (
  id    smallint PRIMARY KEY,
  code  varchar,
  name  varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
  id        smallint PRIMARY KEY,
  region_id smallint NOT NULL REFERENCES regions(id),
  code      varchar,
  name      varchar NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_districts_region ON districts (region_id);

CREATE TABLE IF NOT EXISTS communes (
  id          integer PRIMARY KEY,
  district_id smallint NOT NULL REFERENCES districts(id),
  code        varchar,
  name        varchar NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_communes_district ON communes (district_id);

CREATE TABLE IF NOT EXISTS fokontany (
  id          integer PRIMARY KEY,
  commune_id  integer NOT NULL REFERENCES communes(id),
  code        varchar,
  name        varchar NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fokontany_commune ON fokontany (commune_id);

-- ── Colonnes sur medical_entities ───────────────────────────────────────────
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS type_slug             varchar;
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS category_slug         varchar;
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS classification_status varchar NOT NULL DEFAULT 'unverified';
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS region_id             smallint;
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS district_id           smallint;
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS commune_id            integer;
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS fokontany_id          integer;

-- Contraintes (idempotentes via catalogue)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_me_type') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT fk_me_type
      FOREIGN KEY (type_slug) REFERENCES medical_types(slug) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_me_category') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT fk_me_category
      FOREIGN KEY (category_slug) REFERENCES medical_categories(slug) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_me_region') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT fk_me_region
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_me_district') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT fk_me_district
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_me_commune') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT fk_me_commune
      FOREIGN KEY (commune_id) REFERENCES communes(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_me_fokontany') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT fk_me_fokontany
      FOREIGN KEY (fokontany_id) REFERENCES fokontany(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_me_classification_status') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT chk_me_classification_status
      CHECK (classification_status IN ('osm_auto', 'verified', 'unverified'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_me_type_slug     ON medical_entities (type_slug);
CREATE INDEX IF NOT EXISTS idx_me_category_slug ON medical_entities (category_slug);
CREATE INDEX IF NOT EXISTS idx_me_region_id     ON medical_entities (region_id);
CREATE INDEX IF NOT EXISTS idx_me_district_id   ON medical_entities (district_id);
CREATE INDEX IF NOT EXISTS idx_me_unverified    ON medical_entities (classification_status) WHERE classification_status = 'unverified';
CREATE INDEX IF NOT EXISTS idx_me_latlng        ON medical_entities (lat, lng) WHERE lat IS NOT NULL;

COMMIT;
