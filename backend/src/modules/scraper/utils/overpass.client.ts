import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { OVERPASS_ENDPOINT, OVERPASS_QUERY } from '../../../common/config/scraper.config';
import type { OsmElement, OverpassResponse } from '../../../common/types';

interface LocalRecord {
  osm_id: string;
  name: string | null;
  name_mg: string | null;
  amenity: string | null;
  healthcare: string | null;
  health_facility_type: string | null;
  lat: number;
  lon: number;
  address: {
    street: string | null;
    housenumber: string | null;
    city: string | null;
    postcode: string | null;
    district: string | null;
    province: string | null;
  };
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  operator: string | null;
  operator_type: string | null;
  beds: number | null;
  emergency: boolean | null;
  osm_url: string | null;
  raw_tags: Record<string, string>;
}

function localToOsmElement(r: LocalRecord): OsmElement {
  const tags: Record<string, string> = { ...r.raw_tags };

  // Ajoute les champs extraits qui ne sont pas forcément dans raw_tags
  if (r.name)                tags['name']              = r.name;
  if (r.name_mg)             tags['name:mg']           = r.name_mg;
  if (r.amenity)             tags['amenity']           = r.amenity;
  if (r.healthcare)          tags['healthcare']        = r.healthcare;
  if (r.health_facility_type) tags['health_facility:type'] = r.health_facility_type;
  if (r.phone)               tags['phone']             = r.phone;
  if (r.website)             tags['website']           = r.website;
  if (r.opening_hours)       tags['opening_hours']     = r.opening_hours;
  if (r.operator)            tags['operator']          = r.operator;
  if (r.operator_type)       tags['operator:type']     = r.operator_type;
  if (r.beds != null)        tags['beds']              = String(r.beds);
  if (r.emergency != null)   tags['emergency']         = r.emergency ? 'yes' : 'no';
  if (r.address.street)      tags['addr:street']       = r.address.street;
  if (r.address.housenumber) tags['addr:housenumber']  = r.address.housenumber;
  if (r.address.city)        tags['addr:city']         = r.address.city;
  if (r.address.district)    tags['addr:district']     = r.address.district;
  if (r.address.province)    tags['addr:province']     = r.address.province;

  const [type, rawId] = r.osm_id.split('/');
  return {
    type: type as 'node' | 'way' | 'relation',
    id: Number(rawId),
    lat: r.lat,
    lon: r.lon,
    tags,
  };
}

@Injectable()
export class OverpassClient {
  private readonly logger = new Logger(OverpassClient.name);
  private readonly localCachePath = path.join(
    process.cwd(),
    'data',
    'osm_medical_madagascar.json',
  );

  async fetchAll(): Promise<OsmElement[]> {
    try {
      this.logger.log('Tentative Overpass API…');
      const elements = await this.fetchFromOverpass();
      this.logger.log(`${elements.length} éléments reçus depuis Overpass`);
      return elements;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Overpass inaccessible (${msg}) — fallback fichier local`);
      return this.loadLocalCache();
    }
  }

  private async fetchFromOverpass(): Promise<OsmElement[]> {
    const body = `data=${encodeURIComponent(OVERPASS_QUERY)}`;
    const data = await this.post(body);
    const res = data as OverpassResponse;
    if (!res.elements) throw new Error('Réponse Overpass invalide (pas de champ elements)');
    return res.elements;
  }

  private loadLocalCache(): OsmElement[] {
    if (!fs.existsSync(this.localCachePath)) {
      throw new Error(`Fichier local introuvable : ${this.localCachePath}`);
    }
    const raw: LocalRecord[] = JSON.parse(fs.readFileSync(this.localCachePath, 'utf-8'));
    this.logger.log(`${raw.length} entités chargées depuis ${this.localCachePath}`);
    return raw.map(localToOsmElement);
  }

  private post(body: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const url = new URL(OVERPASS_ENDPOINT);
      const options: https.RequestOptions = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'Medinaa/1.0 (medical entities Madagascar)',
        },
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString());
            resolve(parsed);
          } catch (e) {
            reject(new Error(`JSON parse error: ${e}`));
          }
        });
        res.on('error', reject);
      });

      req.on('error', reject);
      req.setTimeout(30_000, () => {
        req.destroy();
        reject(new Error('Overpass timeout'));
      });

      req.write(body);
      req.end();
    });
  }
}
