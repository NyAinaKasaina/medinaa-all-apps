import * as https from 'https';
import { Injectable, Logger } from '@nestjs/common';
import { OVERPASS_ENDPOINT, OVERPASS_QUERY } from '../../../common/config/scraper.config';
import type { OsmElement, OverpassResponse } from '../../../common/types';

@Injectable()
export class OverpassClient {
  private readonly logger = new Logger(OverpassClient.name);

  async fetchAll(): Promise<OsmElement[]> {
    this.logger.log('Requête Overpass en cours…');
    const body = `data=${encodeURIComponent(OVERPASS_QUERY)}`;
    const data = await this.post(body);
    const elements = (data as OverpassResponse).elements ?? [];
    this.logger.log(`${elements.length} éléments reçus depuis Overpass`);
    return elements;
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
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e}`));
          }
        });
        res.on('error', reject);
      });

      req.on('error', reject);
      req.setTimeout(200_000, () => {
        req.destroy();
        reject(new Error('Overpass timeout (200s)'));
      });

      req.write(body);
      req.end();
    });
  }
}
