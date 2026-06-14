-- 008 — Purge des entités hors Madagascar (Mayotte / Comores) captées par la bbox OSM.
-- Boîtes géographiques clairement hors du territoire malgache (aucune entité MDG à ces coordonnées).
-- Vérifié le 2026-06-14 : 136 entités, toutes code_faritra NULL, noms comoriens/mahorais.
-- Idempotent (re-DELETE sans effet une fois purgé).

BEGIN;

DELETE FROM medical_entities
WHERE (lat BETWEEN -13.10 AND -12.55 AND lng BETWEEN 44.95 AND 45.35)   -- Mayotte
   OR (lat BETWEEN -12.55 AND -11.30 AND lng BETWEEN 43.15 AND 44.60);  -- Comores

COMMIT;
