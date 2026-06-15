/*
 * Comble le site web des entités déjà appariées à Google (google_place_id présent, website vide).
 * Une requête Place Details (champ website) par entité. Ne réécrit jamais un website existant.
 * Lancer : node scripts/google-website.cjs   (depuis backend/)
 */
const https = require('https');
require('dotenv').config();
const { Client } = require('pg');

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const DB = { host: 'localhost', port: 5432, user: 'medinaa', password: 'medinaa', database: 'medinaa' };
const SLEEP = 90;

const get = (url) => new Promise((res, rej) => https.get(url, (r) => { let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let calls = 0;
async function website(pid) {
  calls++;
  const d = await get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${pid}&fields=website&language=fr&key=${KEY}`);
  if (d.status === 'OVER_QUERY_LIMIT' || d.status === 'REQUEST_DENIED') throw new Error(`Google: ${d.status} ${d.error_message || ''}`);
  return d.status === 'OK' ? d.result?.website || null : null;
}

async function main() {
  if (!KEY) { console.error('GOOGLE_MAPS_API_KEY manquant dans backend/.env'); process.exit(1); }
  const db = new Client(DB);
  await db.connect();
  const ents = (await db.query('SELECT id, google_place_id FROM medical_entities WHERE google_place_id IS NOT NULL AND website IS NULL')).rows;
  console.log(`${ents.length} entités à compléter (website)`);
  let filled = 0;
  for (const e of ents) {
    const w = await website(e.google_place_id);
    await sleep(SLEEP);
    if (w) { await db.query('UPDATE medical_entities SET website=$1 WHERE id=$2', [w, e.id]); filled++; }
    if (calls % 50 === 0) console.log(`  ${calls} appels / ${filled} sites`);
  }
  console.log(`--- appels : ${calls} (~${(calls * 0.017).toFixed(2)} $) | sites web comblés : ${filled} ---`);
  await db.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
