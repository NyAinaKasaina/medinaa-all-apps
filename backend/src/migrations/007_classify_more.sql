-- 007 — Classification étendue depuis les tags OSM (data cleaning, idempotent)
-- Ne touche que classification_status='unverified'. Statut résultant 'osm_auto' (auto, à vérifier).
-- Mappings fiables + 2 défauts documentés (hospital->CHD, health_post->CSB1) à confirmer ensuite.
-- Ordre important : health_post AVANT doctors (un health_post+doctor = CSB2, pas cabinet).

BEGIN;

-- health_post + médecin -> CSB2 (géré par un médecin)
UPDATE medical_entities SET type_slug='csb2', category_slug='soins_proximite', classification_status='osm_auto'
  WHERE classification_status='unverified' AND amenity='health_post' AND healthcare='doctor';

-- health_post (infirmier ou non précisé) -> CSB1 (défaut : centre de base, infirmier)
UPDATE medical_entities SET type_slug='csb1', category_slug='soins_proximite', classification_status='osm_auto'
  WHERE classification_status='unverified' AND amenity='health_post';

-- doctors / doctor -> cabinet médical général
UPDATE medical_entities SET type_slug='cabinet_medical_general', category_slug='soins_proximite', classification_status='osm_auto'
  WHERE classification_status='unverified' AND (amenity='doctors' OR healthcare='doctor');

-- infirmier seul -> soins infirmiers
UPDATE medical_entities SET type_slug='soins_infirmiers', category_slug='soins_proximite', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare='nurse';

-- hospital -> CHD (DÉFAUT : la majorité sont des hôpitaux de district ; les CHU, rares, à reclasser)
UPDATE medical_entities SET type_slug='hopital_chd', category_slug='urgences_secours', classification_status='osm_auto'
  WHERE classification_status='unverified' AND (amenity='hospital' OR healthcare='hospital');

COMMIT;
