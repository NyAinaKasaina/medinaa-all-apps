-- 004 — Reclassement OSM -> taxonomie (idempotent)
-- Ne mappe que les types OSM non ambigus. Ne touche QUE les lignes encore 'unverified'
-- (préserve toute curation manuelle 'verified'). Les types ambigus (hospital CHU/CHD,
-- health_post CSB1/CSB2, doctors, clinic) restent 'unverified' pour curation.

BEGIN;

UPDATE medical_entities SET type_slug='pharmacie_officine', category_slug='produits_sante', classification_status='osm_auto'
  WHERE classification_status='unverified' AND amenity='pharmacy';

UPDATE medical_entities SET type_slug='cabinet_dentaire', category_slug='soins_specialises', classification_status='osm_auto'
  WHERE classification_status='unverified' AND (amenity='dentist' OR healthcare='dentist');

UPDATE medical_entities SET type_slug='laboratoire_analyses', category_slug='diagnostic_analyse', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare='laboratory';

UPDATE medical_entities SET type_slug='readaptation_physio', category_slug='soins_specialises', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare='physiotherapist';

UPDATE medical_entities SET type_slug='ophtalmologie_optometrie', category_slug='soins_specialises', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare='optometrist';

UPDATE medical_entities SET type_slug='banque_sang', category_slug='urgences_secours', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare='blood_bank';

UPDATE medical_entities SET type_slug='maternite', category_slug='maternite_enfance', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare IN ('midwife','birthing_centre');

UPDATE medical_entities SET type_slug='agent_communautaire_agree', category_slug='maternite_enfance', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare='community_health_worker';

COMMIT;
