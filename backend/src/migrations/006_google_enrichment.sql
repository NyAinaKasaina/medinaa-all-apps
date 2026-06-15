-- 006 — Suivi de l'enrichissement Google (idempotent)
-- Bootstrap ponctuel nom/téléphone/horaires depuis Google Places, puis bascule
-- en gestion par les propriétaires. On ne stocke durablement que le place_id (autorisé
-- par les ToS Google) + un horodatage ; les champs nom/tel/horaires vivent dans les
-- colonnes existantes (comblées si vides) et seront ensuite maintenus par les owners.

BEGIN;

ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS google_place_id   varchar;
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS google_enriched_at timestamp;

CREATE INDEX IF NOT EXISTS idx_me_google_place_id ON medical_entities (google_place_id) WHERE google_place_id IS NOT NULL;

COMMIT;
