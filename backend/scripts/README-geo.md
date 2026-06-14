# Enrichissement géographique (phase 2)

Rattache chaque entité médicale (lat/lng) à sa hiérarchie administrative officielle
(faritra/distrika/kaominina/fokontany, codification INSTAT), via les codes de `data-personne`
et la géométrie de geoBoundaries.

## Structure adoptée (alignée sur data-personne)

Table `fokontany` dénormalisée : `code_fokontany` CHAR(8) PK, `code_faritra` CHAR(2),
`code_distrika` CHAR(4), `code_kaominina` CHAR(6) + `nom_*` aux 4 niveaux. Les codes
s'imbriquent par préfixe (`11010102` → kaominina `110101` → distrika `1101` → faritra `11`).
`medical_entities` porte `code_faritra/distrika/kaominina/fokontany` (profondeur variable).

## Reproduire (DB vide → enrichie)

```bash
# 1. Schéma géo (depuis backend/src/migrations/)
psql -v ON_ERROR_STOP=1 -h localhost -U medinaa -d medinaa -f 005_geo_align_datapersonne.sql

# 2. Copier la référence officielle depuis la base datapersonne (19 336 fokontany)
DPURL=$(grep '^DATABASE_URL' "../../../data-personne/.env" | sed -E 's/^DATABASE_URL=//; s/"//g')
psql "$DPURL" -c "\copy (SELECT code_fokontany,code_faritra,code_distrika,code_kaominina,nom_faritra,nom_distrika,nom_kaominina,nom_fokontany FROM fokontany) TO STDOUT WITH CSV" \
  | PGPASSWORD=medinaa psql -h localhost -U medinaa -d medinaa \
    -c "\copy fokontany(code_fokontany,code_faritra,code_distrika,code_kaominina,nom_faritra,nom_distrika,nom_kaominina,nom_fokontany) FROM STDIN WITH CSV"

# 3. Télécharger les limites geoBoundaries (gitignored, ~170 Mo) dans backend/data/geo/
mkdir -p ../data/geo && cd ../data/geo
for L in ADM1 ADM2 ADM3 ADM4; do
  curl -sL -o "mdg-$L.geojson" \
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MDG/$L/geoBoundaries-MDG-$L.geojson"
done
cd ../../

# 4. Géocoder les entités (point-in-polygon Node, sans PostGIS)
node --max-old-space-size=4096 scripts/geo-enrich.cjs
```

## Couverture obtenue (2177 entités)

faritra 94% · distrika 91% · kaominina 63% · fokontany 52% (best-effort).

## Limites connues

- geoBoundaries = 22 régions (pré-réforme 2021) vs 23 officielles. Région scindée
  Vatovavy-Fitovinany résolue via le district. Haute Matsiatra = « Matsiatra Ambony » (alias).
- Antananarivo : arrondissements geoBoundaries mappés vers ANTANANARIVO_I..VI.
- Niveaux fins (commune/fokontany) : 17 465 polygones geoBoundaries ≠ 19 336 fokontany officiels,
  noms divergents → match partiel par préfixe commun. Une vraie source géométrie+codes officiels
  (shapefile BNGRC) permettrait 100%.
- Les ~6% d'entités sans région sont des points hors polygones (coordonnées au large / en bordure).
