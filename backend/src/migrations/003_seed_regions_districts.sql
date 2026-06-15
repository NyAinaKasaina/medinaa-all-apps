-- 003 — Seed géographique : 24 régions + districts (idempotent, UPSERT)
-- Source : Wikipédia "Districts of Madagascar" (structure 2024, 24 régions après création d'Ambatosoa).
-- NOTE : liste de districts = base de travail (~114). Quelques districts très récents
-- peuvent manquer ; à vérifier/compléter contre l'INSTAT en phase 2 (avec Communes/Fokontany).

BEGIN;

INSERT INTO regions (id, name) VALUES
  (1,'Analamanga'),(2,'Vakinankaratra'),(3,'Itasy'),(4,'Bongolava'),
  (5,'Haute Matsiatra'),(6,'Amoron''i Mania'),(7,'Vatovavy'),(8,'Fitovinany'),
  (9,'Atsimo-Atsinanana'),(10,'Ihorombe'),(11,'Atsinanana'),(12,'Analanjirofo'),
  (13,'Ambatosoa'),(14,'Alaotra-Mangoro'),(15,'Boeny'),(16,'Sofia'),
  (17,'Betsiboka'),(18,'Melaky'),(19,'Atsimo-Andrefana'),(20,'Androy'),
  (21,'Anosy'),(22,'Menabe'),(23,'Diana'),(24,'Sava')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO districts (id, region_id, name) VALUES
  -- Analamanga
  (1,1,'Ambohidratrimo'),(2,1,'Andramasina'),(3,1,'Anjozorobe'),(4,1,'Ankazobe'),
  (5,1,'Antananarivo-Atsimondrano'),(6,1,'Antananarivo-Avaradrano'),(7,1,'Antananarivo-Renivohitra'),(8,1,'Manjakandriana'),
  -- Vakinankaratra
  (9,2,'Ambatolampy'),(10,2,'Antanifotsy'),(11,2,'Antsirabe I'),(12,2,'Antsirabe II'),(13,2,'Betafo'),(14,2,'Faratsiho'),(15,2,'Mandoto'),
  -- Itasy
  (16,3,'Arivonimamo'),(17,3,'Miarinarivo'),(18,3,'Soavinandriana'),
  -- Bongolava
  (19,4,'Fenoarivobe'),(20,4,'Tsiroanomandidy'),
  -- Haute Matsiatra
  (21,5,'Ambalavao'),(22,5,'Ambohimahasoa'),(23,5,'Fianarantsoa I'),(24,5,'Ikalamavony'),(25,5,'Isandra'),(26,5,'Lalangina'),(27,5,'Vohibato'),
  -- Amoron'i Mania
  (28,6,'Ambatofinandrahana'),(29,6,'Ambositra'),(30,6,'Fandriana'),(31,6,'Manandriana'),
  -- Vatovavy
  (32,7,'Ifanadiana'),(33,7,'Mananjary'),(34,7,'Nosy Varika'),
  -- Fitovinany
  (35,8,'Ikongo'),(36,8,'Manakara'),(37,8,'Vohipeno'),
  -- Atsimo-Atsinanana
  (38,9,'Befotaka'),(39,9,'Farafangana'),(40,9,'Midongy-Atsimo'),(41,9,'Vangaindrano'),(42,9,'Vondrozo'),
  -- Ihorombe
  (43,10,'Iakora'),(44,10,'Ihosy'),(45,10,'Ivohibe'),
  -- Atsinanana
  (46,11,'Antanambao-Manampotsy'),(47,11,'Brickaville'),(48,11,'Mahanoro'),(49,11,'Marolambo'),(50,11,'Toamasina I'),(51,11,'Toamasina II'),(52,11,'Vatomandry'),
  -- Analanjirofo
  (53,12,'Fenoarivo-Atsinanana'),(54,12,'Nosy Boraha'),(55,12,'Soanierana-Ivongo'),(56,12,'Vavatenina'),
  -- Ambatosoa
  (57,13,'Mananara Avaratra'),(58,13,'Maroantsetra'),
  -- Alaotra-Mangoro
  (59,14,'Ambatondrazaka'),(60,14,'Amparafaravola'),(61,14,'Andilamena'),(62,14,'Anosibe-An''ala'),(63,14,'Moramanga'),
  -- Boeny
  (64,15,'Ambato-Boeni'),(65,15,'Mahajanga I'),(66,15,'Mahajanga II'),(67,15,'Marovoay'),(68,15,'Mitsinjo'),(69,15,'Soalala'),
  -- Sofia
  (70,16,'Analalava'),(71,16,'Antsohihy'),(72,16,'Bealanana'),(73,16,'Befandriana Avaratra'),(74,16,'Boriziny'),(75,16,'Mampikony'),(76,16,'Mandritsara'),
  -- Betsiboka
  (77,17,'Kandreho'),(78,17,'Maevatanana'),(79,17,'Tsaratanana'),
  -- Melaky
  (80,18,'Ambatomainty'),(81,18,'Antsalova'),(82,18,'Besalampy'),(83,18,'Maintirano'),(84,18,'Morafenobe'),
  -- Atsimo-Andrefana
  (85,19,'Ampanihy'),(86,19,'Ankazoabo-Atsimo'),(87,19,'Benenitra'),(88,19,'Beroroha'),(89,19,'Betioky-Atsimo'),(90,19,'Morombe'),(91,19,'Sakaraha'),(92,19,'Toliara I'),(93,19,'Toliara II'),
  -- Androy
  (94,20,'Ambovombe-Androy'),(95,20,'Bekily'),(96,20,'Beloha'),(97,20,'Tsihombe'),
  -- Anosy
  (98,21,'Amboasary-Atsimo'),(99,21,'Betroka'),(100,21,'Taolagnaro'),
  -- Menabe
  (101,22,'Belon''i Tsiribihina'),(102,22,'Mahabo'),(103,22,'Manja'),(104,22,'Miandrivazo'),(105,22,'Morondava'),
  -- Diana
  (106,23,'Ambanja'),(107,23,'Ambilobe'),(108,23,'Antsiranana I'),(109,23,'Antsiranana II'),(110,23,'Nosy Be'),
  -- Sava
  (111,24,'Andapa'),(112,24,'Antalaha'),(113,24,'Sambava'),(114,24,'Vohemar')
ON CONFLICT (id) DO UPDATE SET region_id = EXCLUDED.region_id, name = EXCLUDED.name;

COMMIT;
