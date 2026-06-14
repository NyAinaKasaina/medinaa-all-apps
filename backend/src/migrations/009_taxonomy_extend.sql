-- 009 — Extension de la taxonomie pour absorber les 'unverified' restants (idempotent)
-- Ajoute 3 types (catégorie soins_proximite) puis mappe les tags OSM correspondants.
-- Ne touche que classification_status='unverified', statut résultant 'osm_auto' (à vérifier).

BEGIN;

INSERT INTO medical_types (slug, category_slug, label_fr, label_en, description, sort_order) VALUES
  ('clinique_polyclinique',   'soins_proximite', 'Clinique / Polyclinique',            'Clinic / Polyclinic',          'Établissement de soins privé (consultations, parfois hospitalisation)', 6),
  ('maison_repos',            'soins_proximite', 'Maison de repos / Soins longue durée', 'Nursing home / Long-term care', 'Hébergement médicalisé, personnes âgées ou convalescentes',            7),
  ('medecine_traditionnelle', 'soins_proximite', 'Médecine traditionnelle / alternative','Traditional / alternative medicine', 'Tradipraticiens, médecines alternatives',                       8)
ON CONFLICT (slug) DO UPDATE SET
  category_slug = EXCLUDED.category_slug, label_fr = EXCLUDED.label_fr, label_en = EXCLUDED.label_en,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

UPDATE medical_entities SET type_slug='clinique_polyclinique', category_slug='soins_proximite', classification_status='osm_auto'
  WHERE classification_status='unverified' AND (amenity='clinic' OR healthcare='clinic');

UPDATE medical_entities SET type_slug='maison_repos', category_slug='soins_proximite', classification_status='osm_auto'
  WHERE classification_status='unverified' AND (amenity='nursing_home' OR healthcare='nursing_home');

UPDATE medical_entities SET type_slug='medecine_traditionnelle', category_slug='soins_proximite', classification_status='osm_auto'
  WHERE classification_status='unverified' AND healthcare='alternative';

COMMIT;
