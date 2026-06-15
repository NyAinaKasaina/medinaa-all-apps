-- 002 — Seed taxonomie : 6 catégories + 25 types (idempotent, UPSERT)

BEGIN;

INSERT INTO medical_categories (slug, label_fr, label_mg, label_en, sort_order, color, icon) VALUES
  ('urgences_secours',   'Urgences & secours',   'Vonjy aina sy famonjena',      'Emergency & rescue',     1, '#dc2626', 'siren'),
  ('soins_proximite',    'Soins de proximité',   'Fitsaboana akaiky',            'Primary care',           2, '#059669', 'stethoscope'),
  ('soins_specialises',  'Soins spécialisés',    'Fitsaboana manokana',          'Specialized care',       3, '#7c3aed', 'heart-pulse'),
  ('maternite_enfance',  'Maternité & enfance',  'Fiterahana sy ankizy',         'Maternity & childhood',  4, '#db2777', 'baby'),
  ('produits_sante',     'Produits de santé',    'Vokatra ara-pahasalamana',     'Health products',        5, '#2563eb', 'pill'),
  ('diagnostic_analyse', 'Diagnostic & analyse', 'Famantarana sy famakafakana',  'Diagnostics & analysis', 6, '#d97706', 'microscope')
ON CONFLICT (slug) DO UPDATE SET
  label_fr = EXCLUDED.label_fr, label_mg = EXCLUDED.label_mg, label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order, color = EXCLUDED.color, icon = EXCLUDED.icon;

INSERT INTO medical_types (slug, category_slug, label_fr, label_en, description, sort_order) VALUES
  -- urgences_secours
  ('hopital_chu',             'urgences_secours',  'CHU (Centre Hospitalier Universitaire)', 'University hospital',        'Urgences majeures, spécialités',                 1),
  ('hopital_chd',             'urgences_secours',  'CHD (Centre Hospitalier de District)',   'District hospital',         'Chirurgie de base, urgences régionales',         2),
  ('clinique_urgence_privee', 'urgences_secours',  'Clinique d''urgence privée',             'Private emergency clinic',  'Service d''urgence privé 24/7',                  3),
  ('ambulance_evasan',        'urgences_secours',  'Ambulance / Évasan',                     'Ambulance / medical evac',  'Ambulances et évacuations sanitaires',           4),
  ('banque_sang',             'urgences_secours',  'Banque de sang',                         'Blood bank',                'Centre de transfusion sanguine',                 5),
  ('centre_antipoison',       'urgences_secours',  'Centre antipoison',                      'Poison control center',     'Service d''urgence antipoison',                  6),
  -- soins_proximite
  ('csb2',                    'soins_proximite',   'CSB2 (Centre de Santé de Base 2)',       'Basic health center 2',     'Géré par un médecin (public)',                   1),
  ('csb1',                    'soins_proximite',   'CSB1 (Centre de Santé de Base 1)',       'Basic health center 1',     'Géré par un infirmier (public)',                 2),
  ('cabinet_medical_general', 'soins_proximite',   'Cabinet médical généraliste',            'General practice',          'Consultation de médecine générale (privé)',      3),
  ('dispensaire_confessionnel','soins_proximite',  'Dispensaire confessionnel',              'Faith-based dispensary',    'Géré par des missions ou ONG',                   4),
  ('soins_infirmiers',        'soins_proximite',   'Soins infirmiers',                       'Nursing care',              'Cabinets ou infirmiers à domicile',              5),
  -- soins_specialises
  ('cabinet_dentaire',        'soins_specialises',  'Cabinet dentaire',                      'Dental practice',           'Chirurgie dentaire / orthodontie',               1),
  ('ophtalmologie_optometrie','soins_specialises',  'Ophtalmologie / Optométrie',            'Ophthalmology / optometry', 'Soins des yeux et opticiens',                    2),
  ('cabinet_pediatrie',       'soins_specialises',  'Pédiatrie',                             'Pediatrics',                'Spécialistes des enfants',                       3),
  ('sante_mentale_psychologie','soins_specialises', 'Santé mentale / Psychologie',           'Mental health / psychology','Psychiatres, psychologues, centres de crise',    4),
  ('readaptation_physio',     'soins_specialises',  'Rééducation / Physiothérapie',          'Rehabilitation / physio',   'Kinésithérapeutes et rééducateurs',              5),
  -- maternite_enfance
  ('maternite',               'maternite_enfance', 'Maternité',                              'Maternity',                 'Accouchement',                                   1),
  ('planification_familiale', 'maternite_enfance', 'Planification familiale',                'Family planning',           'Santé sexuelle, contraception, ITSS',            2),
  ('centre_vaccination',      'maternite_enfance', 'Centre de vaccination',                  'Vaccination center',        'Vaccination infantile',                          3),
  ('agent_communautaire_agree','maternite_enfance','Agent communautaire agréé',              'Community health worker',   'Relais de santé en zone reculée (Reninjaza)',    4),
  -- produits_sante
  ('pharmacie_officine',      'produits_sante',    'Pharmacie (officine)',                   'Pharmacy',                  'Pharmacies en milieu urbain',                    1),
  ('depot_medicaments',       'produits_sante',    'Dépôt de médicaments',                   'Medicine depot',            'Vente autorisée en zone rurale',                 2),
  ('parapharmacie',           'produits_sante',    'Parapharmacie',                          'Parapharmacy',              'Produits de soin et d''hygiène',                 3),
  -- diagnostic_analyse
  ('laboratoire_analyses',    'diagnostic_analyse','Laboratoire d''analyses',                'Analysis laboratory',       'Prélèvements sanguins et médicaux',              1),
  ('imagerie_medicale',       'diagnostic_analyse','Imagerie médicale',                      'Medical imaging',           'Radiographie, échographie, scanner, IRM',        2)
ON CONFLICT (slug) DO UPDATE SET
  category_slug = EXCLUDED.category_slug, label_fr = EXCLUDED.label_fr, label_en = EXCLUDED.label_en,
  description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

COMMIT;
