/*
 * Enrichissement ponctuel nom / téléphone / horaires depuis Google Places.
 * Comble UNIQUEMENT les champs vides (ne réécrit pas une valeur existante) ; après ce bootstrap,
 * la donnée est destinée à être maintenue par les propriétaires (comptes établissements).
 * Stockage : seul google_place_id est conservé durablement (autorisé par les ToS Google) +
 * un horodatage ; nom/tel/horaires vont dans les colonnes existantes.
 *
 * Clé : GOOGLE_MAPS_API_KEY dans backend/.env (jamais commitée).
 * Pilote recommandé : node scripts/google-enrich.cjs --limit 25
 * Run complet :       node scripts/google-enrich.cjs
 * Options : --limit N | --max-dist M (m, défaut 1500) | --radius M | --sleep ms | --refresh | --nameless
 */
const https = require('https');
require('dotenv').config();
const { Client } = require('pg');

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const DB = { host: 'localhost', port: 5432, user: 'medinaa', password: 'medinaa', database: 'medinaa' };

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const LIMIT = Number(opt('--limit', '0')) || null;
const MAXDIST = Number(opt('--max-dist', '1500'));   // distance max candidat <-> entité (m)
const RADIUS = Number(opt('--radius', '1500'));      // biais de localisation Find Place (m)
const SLEEP = Number(opt('--sleep', '120'));         // pause entre appels (ms)
const REFRESH = args.includes('--refresh');          // ré-enrichir même si déjà fait
const NAMELESS = args.includes('--nameless');        // tenter les entités sans nom (nearby, faible confiance)
const FARITRA = opt('--faritra', null);              // cibler une région (code), pour pilote
const CATEGORY = opt('--category', null);            // cibler une catégorie (slug), pour pilote

const COST_PER_CALL = 0.017; // indicatif (Find Place / Details ~ 17 $/1000)

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, (r) => { let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function haversine(la1, lo1, la2, lo2) {
  const R = 6371000, r = Math.PI / 180;
  const dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// Mots génériques médicaux : ne pas s'y fier pour l'appariement (trop communs).
const STOP = new Set(['CABINET', 'CLINIQUE', 'HOPITAL', 'PHARMACIE', 'CENTRE', 'CSB', 'CSB1', 'CSB2', 'DISPENSAIRE', 'MEDICAL', 'MEDICALE', 'SANTE', 'DR', 'DOCTEUR', 'DOKOTERA', 'DE', 'DU', 'DES', 'LA', 'LE', 'ET', 'CHU', 'CHD']);
const tokens = (s) => norm(s).split(' ').filter((t) => t.length >= 4 && !STOP.has(t));
// Le nom de l'entité partage-t-il un token distinctif avec le nom Google ?
function nameMatches(entityName, googleName) {
  const a = tokens(entityName), b = new Set(tokens(googleName));
  if (!a.length) return false;
  return a.some((t) => b.has(t) || [...b].some((x) => x.includes(t) || t.includes(x)));
}

let calls = 0;
// Recherche géographiquement stricte (rayon dur) par mot-clé = nom, puis filtre par token distinctif.
async function findByName(name, lat, lng) {
  calls++;
  const u = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${RADIUS}&keyword=${encodeURIComponent(name)}&language=fr&key=${KEY}`;
  const d = await get(u);
  if (d.status === 'OVER_QUERY_LIMIT' || d.status === 'REQUEST_DENIED') throw new Error(`Google: ${d.status} ${d.error_message || ''}`);
  if (d.status !== 'OK' || !d.results?.length) return null;
  const hit = d.results.find((r) => nameMatches(name, r.name));
  return hit ? { place_id: hit.place_id, name: hit.name, geometry: hit.geometry } : null;
}
async function findNearby(lat, lng) {
  calls++;
  const u = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=health&language=fr&key=${KEY}`;
  const d = await get(u);
  if (d.status === 'OVER_QUERY_LIMIT' || d.status === 'REQUEST_DENIED') throw new Error(`Google: ${d.status} ${d.error_message || ''}`);
  return d.status === 'OK' && d.results?.length ? d.results[0] : null;
}
async function details(pid) {
  calls++;
  const u = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pid}&fields=name,formatted_phone_number,international_phone_number,opening_hours&language=fr&key=${KEY}`;
  const d = await get(u);
  return d.status === 'OK' ? d.result : null;
}

async function main() {
  if (!KEY) { console.error('GOOGLE_MAPS_API_KEY manquant dans backend/.env'); process.exit(1); }
  const db = new Client(DB);
  await db.connect();

  const conds = ['lat IS NOT NULL', 'lng IS NOT NULL'];
  conds.push(REFRESH
    ? '(phone IS NULL OR opening_hours IS NULL OR name IS NULL)'
    : '(google_place_id IS NULL AND (phone IS NULL OR opening_hours IS NULL OR name IS NULL))');
  if (FARITRA) conds.push(`code_faritra = '${FARITRA}'`);
  if (CATEGORY) conds.push(`category_slug = '${CATEGORY}'`);
  const sql = `SELECT id, name, lat, lng, phone, opening_hours FROM medical_entities
               WHERE ${conds.join(' AND ')}
               ORDER BY (name IS NULL), name ${LIMIT ? `LIMIT ${LIMIT}` : ''}`;
  const ents = (await db.query(sql)).rows;
  console.log(`${ents.length} entités candidates (limit=${LIMIT || '∞'}, nameless=${NAMELESS})`);

  const stat = { matched: 0, noMatch: 0, tooFar: 0, phone: 0, hours: 0, name: 0, skippedNameless: 0 };
  for (const e of ents) {
    const lat = Number(e.lat), lng = Number(e.lng);
    let cand = null;
    if (e.name) cand = await findByName(e.name, lat, lng);
    else if (NAMELESS) cand = await findNearby(lat, lng);
    else { stat.skippedNameless++; continue; }
    await sleep(SLEEP);
    if (!cand) { stat.noMatch++; continue; }

    const loc = cand.geometry?.location;
    if (loc && haversine(lat, lng, loc.lat, loc.lng) > MAXDIST) { stat.tooFar++; continue; }

    const det = await details(cand.place_id);
    await sleep(SLEEP);
    if (!det) { stat.noMatch++; continue; }
    stat.matched++;

    const phone = det.formatted_phone_number || det.international_phone_number || null;
    const hours = det.opening_hours?.weekday_text ? det.opening_hours.weekday_text.join('; ') : null;
    const set = [], val = [];
    let i = 1;
    if (!e.phone && phone) { set.push(`phone=$${i++}`); val.push(phone); stat.phone++; }
    if (!e.opening_hours && hours) { set.push(`opening_hours=$${i++}`); val.push(hours); stat.hours++; }
    if (!e.name && det.name) { set.push(`name=$${i++}`); val.push(det.name); stat.name++; }
    set.push(`google_place_id=$${i++}`); val.push(cand.place_id);
    set.push('google_enriched_at=now()');
    val.push(e.id);
    await db.query(`UPDATE medical_entities SET ${set.join(', ')} WHERE id=$${i}`, val);

    if (stat.matched % 10 === 0) console.log(`  ${stat.matched} matchés / ${calls} appels`);
  }

  console.log('--- Résumé ---');
  console.log(`appels API : ${calls} (~${(calls * COST_PER_CALL).toFixed(2)} $ indicatif)`);
  console.log(`matchés : ${stat.matched} | sans correspondance : ${stat.noMatch} | trop loin (>${MAXDIST}m) : ${stat.tooFar} | sans nom ignorés : ${stat.skippedNameless}`);
  console.log(`comblés -> téléphone : ${stat.phone}, horaires : ${stat.hours}, nom : ${stat.name}`);
  await db.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
