-- 005 — Réalignement géo sur data-personne (codification officielle INSTAT, idempotent)
-- Remplace les 4 tables normalisées (regions/districts/communes/fokontany à IDs entiers)
-- par une table `fokontany` dénormalisée à codes hiérarchiques officiels.
-- code_faritra CHAR(2) < code_distrika CHAR(4) < code_kaominina CHAR(6) < code_fokontany CHAR(8).

BEGIN;

-- 1. Retirer les anciennes colonnes géo (IDs entiers) de medical_entities (CASCADE = leurs FK)
ALTER TABLE medical_entities DROP COLUMN IF EXISTS region_id CASCADE;
ALTER TABLE medical_entities DROP COLUMN IF EXISTS district_id CASCADE;
ALTER TABLE medical_entities DROP COLUMN IF EXISTS commune_id CASCADE;
ALTER TABLE medical_entities DROP COLUMN IF EXISTS fokontany_id CASCADE;

-- 2. Supprimer les anciennes tables géo normalisées
DROP TABLE IF EXISTS fokontany CASCADE;
DROP TABLE IF EXISTS communes CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS regions  CASCADE;

-- 3. Table de référence fokontany dénormalisée (structure data-personne)
CREATE TABLE fokontany (
  code_fokontany varchar(8) PRIMARY KEY,
  code_faritra   varchar(2) NOT NULL,
  code_distrika  varchar(4) NOT NULL,
  code_kaominina varchar(6) NOT NULL,
  nom_faritra    varchar NOT NULL,
  nom_distrika   varchar NOT NULL,
  nom_kaominina  varchar NOT NULL,
  nom_fokontany  varchar NOT NULL
);
CREATE INDEX idx_fokontany_faritra   ON fokontany (code_faritra);
CREATE INDEX idx_fokontany_distrika  ON fokontany (code_distrika);
CREATE INDEX idx_fokontany_kaominina ON fokontany (code_kaominina);

-- 4. Colonnes codes sur medical_entities (profondeur variable selon le géocodage)
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS code_faritra   varchar(2);
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS code_distrika  varchar(4);
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS code_kaominina varchar(6);
ALTER TABLE medical_entities ADD COLUMN IF NOT EXISTS code_fokontany varchar(8);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_me_fokontany_code') THEN
    ALTER TABLE medical_entities ADD CONSTRAINT fk_me_fokontany_code
      FOREIGN KEY (code_fokontany) REFERENCES fokontany(code_fokontany) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_me_code_faritra   ON medical_entities (code_faritra)   WHERE code_faritra IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_me_code_distrika  ON medical_entities (code_distrika)  WHERE code_distrika IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_me_code_kaominina ON medical_entities (code_kaominina) WHERE code_kaominina IS NOT NULL;

COMMIT;
