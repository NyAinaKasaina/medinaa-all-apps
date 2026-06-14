/*
 * Géocodage des entités médicales -> codes administratifs officiels (faritra/distrika/kaominina/fokontany).
 * Géométrie : geoBoundaries (backend/data/geo/mdg-ADM{1..4}.geojson, gitignored).
 * Codes : table `fokontany` (copiée de data-personne, codification INSTAT).
 * Stratégie : point-in-polygon par niveau -> nom -> match sur les noms officiels -> code.
 *   Match exact normalisé, puis repli par préfixe commun (>=6, restreint à la région/au district)
 *   pour absorber les variantes (Atsimo/Sud, accents...). Antananarivo : arrondissements mappés.
 *   Région fusionnée Vatovavy-Fitovinany (geoBoundaries) résolue via le district.
 * Lancer : node --max-old-space-size=4096 scripts/geo-enrich.cjs   (depuis backend/)
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const GEO_DIR = path.join(__dirname, '..', 'data', 'geo');
const DB = { host: 'localhost', port: 5432, user: 'medinaa', password: 'medinaa', database: 'medinaa' };

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const commonPrefix = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
// Meilleur candidat par préfixe commun >=6, à condition d'être strictement dominant (pas d'ambiguïté).
function bestByPrefix(n, cands) {
  let best = null, bestLen = 0, second = 0;
  for (const c of cands) {
    const l = commonPrefix(n, c.norm);
    if (l > bestLen) { second = bestLen; bestLen = l; best = c; } else if (l > second) second = l;
  }
  return best && bestLen >= 6 && bestLen > second ? best.code : null;
}
// Inclusion de nom (un nom contient l'autre, >=5 car.) : retenu seulement si UNIQUE dans le lot.
function bestByContainment(n, cands) {
  const hits = cands.filter((c) => {
    const a = c.norm, b = n, m = Math.min(a.length, b.length);
    return m >= 5 && (a.includes(b) || b.includes(a));
  });
  return hits.length === 1 ? hits[0].code : null;
}
// Résolution générique : exact -> préfixe -> inclusion (chacun restreint au lot de candidats).
function resolveCode(name, cands) {
  if (!name || !cands.length) return null;
  const n = norm(name);
  const ex = cands.find((c) => c.norm === n);
  if (ex) return ex.code;
  return bestByPrefix(n, cands) || bestByContainment(n, cands);
}

// ---- Géométrie (point-in-polygon, Polygon + MultiPolygon + trous) ----
function bboxOf(geom) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) for (const ring of poly) for (const p of ring) {
    if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
    if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
  }
  return [minx, miny, maxx, maxy];
}
function ringContains(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function polyContains(x, y, poly) {
  if (!ringContains(x, y, poly[0])) return false;
  for (let k = 1; k < poly.length; k++) if (ringContains(x, y, poly[k])) return false;
  return true;
}
function geomContains(x, y, geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) if (polyContains(x, y, poly)) return true;
  return false;
}
function loadLevel(lvl) {
  const j = JSON.parse(fs.readFileSync(path.join(GEO_DIR, `mdg-${lvl}.geojson`), 'utf8'));
  return j.features.map((f) => ({ name: f.properties.shapeName, bbox: bboxOf(f.geometry), geom: f.geometry }));
}
function locate(x, y, level) {
  for (const u of level) {
    const b = u.bbox;
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
    if (geomContains(x, y, u.geom)) return u;
  }
  return null;
}

async function main() {
  const db = new Client(DB);
  await db.connect();

  // ---- Référentiel officiel -> structures de match ----
  const fk = (await db.query('SELECT code_faritra,code_distrika,code_kaominina,code_fokontany,nom_faritra,nom_distrika,nom_kaominina,nom_fokontany FROM fokontany')).rows;
  const faritraByName = new Map();        // norm(nom) -> code_faritra
  const districtsByFaritra = new Map();   // code_faritra -> [{code, norm}]
  const kaomininaByDistrict = new Map();   // code_distrika -> [{code, norm}]
  const fokontanyByKaominina = new Map();  // code_kaominina -> [{code, norm}]
  const seenD = new Set(), seenK = new Set();
  for (const r of fk) {
    faritraByName.set(norm(r.nom_faritra), r.code_faritra);
    if (!seenD.has(r.code_distrika)) {
      seenD.add(r.code_distrika);
      if (!districtsByFaritra.has(r.code_faritra)) districtsByFaritra.set(r.code_faritra, []);
      districtsByFaritra.get(r.code_faritra).push({ code: r.code_distrika, norm: norm(r.nom_distrika) });
    }
    if (!seenK.has(r.code_kaominina)) {
      seenK.add(r.code_kaominina);
      if (!kaomininaByDistrict.has(r.code_distrika)) kaomininaByDistrict.set(r.code_distrika, []);
      kaomininaByDistrict.get(r.code_distrika).push({ code: r.code_kaominina, norm: norm(r.nom_kaominina) });
    }
    if (!fokontanyByKaominina.has(r.code_kaominina)) fokontanyByKaominina.set(r.code_kaominina, []);
    fokontanyByKaominina.get(r.code_kaominina).push({ code: r.code_fokontany, norm: norm(r.nom_fokontany) });
  }
  // Alias région : geoBoundaries nomme Haute Matsiatra "Matsiatra Ambony".
  const hm = faritraByName.get('HAUTEMATSIATRA');
  if (hm) faritraByName.set('MATSIATRAAMBONY', hm);
  // Antananarivo Renivohitra : arrondissements geoBoundaries -> districts officiels ANTANANARIVO_I..VI.
  const ARR = { '1ERARRONDISSEMENT': '1107', '2EARRONDISSEMENT': '1108', '3EARRONDISSEMENT': '1109', '4EARRONDISSEMENT': '1110', '5EARRONDISSEMENT': '1111', '6EARRONDISSEMENT': '1112' };
  const VATO = faritraByName.get('VATOVAVY'), FITO = faritraByName.get('FITOVINANY');
  console.log(`Référence : ${fk.length} fokontany, ${faritraByName.size} entrées faritra`);

  function faritraSetOf(name) {
    if (!name) return new Set();
    const n = norm(name);
    if (n === 'VATOVAVYFITOVINANY') { const s = new Set(); if (VATO) s.add(VATO); if (FITO) s.add(FITO); return s; }
    const c = faritraByName.get(n);
    return c ? new Set([c]) : new Set();
  }
  function districtOf(name, fSet) {
    if (!name) return null;
    if (ARR[norm(name)]) return ARR[norm(name)];
    let cands = [];
    if (fSet.size) for (const cf of fSet) cands.push(...(districtsByFaritra.get(cf) || []));
    else for (const arr of districtsByFaritra.values()) cands.push(...arr);
    return resolveCode(name, cands);
  }
  function kaomininaOf(name, cd) {
    if (!cd) return null;
    return resolveCode(name, kaomininaByDistrict.get(cd) || []);
  }
  function fokontanyOf(name, ck) {
    if (!ck) return null;
    return resolveCode(name, fokontanyByKaominina.get(ck) || []);
  }

  // ---- Polygones ----
  console.log('Chargement des polygones geoBoundaries...');
  const ADM1 = loadLevel('ADM1'), ADM2 = loadLevel('ADM2'), ADM3 = loadLevel('ADM3'), ADM4 = loadLevel('ADM4');
  console.log(`ADM1 ${ADM1.length} / ADM2 ${ADM2.length} / ADM3 ${ADM3.length} / ADM4 ${ADM4.length}`);

  // ---- Entités ----
  const ents = (await db.query('SELECT id, lat, lng FROM medical_entities WHERE lat IS NOT NULL AND lng IS NOT NULL')).rows;
  console.log(`Géocodage de ${ents.length} entités...`);
  const cov = { faritra: 0, distrika: 0, kaominina: 0, fokontany: 0 };
  const updates = [];
  let done = 0;
  for (const e of ents) {
    const x = Number(e.lng), y = Number(e.lat);
    let cf = null, cd = null, ck = null, cfok = null;

    const fSet = faritraSetOf((locate(x, y, ADM1) || {}).name);
    if (fSet.size === 1) cf = [...fSet][0];

    cd = districtOf((locate(x, y, ADM2) || {}).name, fSet);
    if (cd) cf = cd.slice(0, 2);

    if (cd) { ck = kaomininaOf((locate(x, y, ADM3) || {}).name, cd); if (ck) { cd = ck.slice(0, 4); cf = ck.slice(0, 2); } }

    if (ck) { const c = fokontanyOf((locate(x, y, ADM4) || {}).name, ck); if (c) { cfok = c; ck = c.slice(0, 6); cd = c.slice(0, 4); cf = c.slice(0, 2); } }

    if (cf) cov.faritra++; if (cd) cov.distrika++; if (ck) cov.kaominina++; if (cfok) cov.fokontany++;
    updates.push({ id: e.id, cf, cd, ck, cfok });
    if (++done % 500 === 0) console.log(`  ${done}/${ents.length}`);
  }

  // ---- Écriture ----
  console.log('Mise à jour de la base...');
  await db.query('BEGIN');
  await db.query('UPDATE medical_entities SET code_faritra=NULL, code_distrika=NULL, code_kaominina=NULL, code_fokontany=NULL');
  const CHUNK = 500;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const slice = updates.slice(i, i + CHUNK);
    const vals = [], params = [];
    slice.forEach((u, j) => { const b = j * 5; vals.push(`($${b + 1}::uuid,$${b + 2},$${b + 3},$${b + 4},$${b + 5})`); params.push(u.id, u.cf, u.cd, u.ck, u.cfok); });
    await db.query(
      `UPDATE medical_entities AS m SET code_faritra=v.cf, code_distrika=v.cd, code_kaominina=v.ck, code_fokontany=v.cfok
       FROM (VALUES ${vals.join(',')}) AS v(id,cf,cd,ck,cfok) WHERE m.id = v.id`,
      params,
    );
  }
  await db.query('COMMIT');

  console.log('--- Couverture ---');
  const n = ents.length;
  for (const lvl of ['faritra', 'distrika', 'kaominina', 'fokontany']) console.log(`  ${lvl}: ${cov[lvl]}/${n} (${Math.round((cov[lvl] / n) * 100)}%)`);
  await db.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
