import * as https from 'https';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SCRAPER_CONFIG } from '../../../common/config/scraper.config';
import type { NearbyPlace, PlaceDetails } from '../../../common/types';

const BASE = 'https://maps.googleapis.com/maps/api/place';

interface NearbyResponse {
  status: string;
  error_message?: string;
  results: NearbyPlace[];
  next_page_token?: string;
}

interface DetailsResponse {
  status: string;
  result?: PlaceDetails;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
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
    req.setTimeout(30_000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

@Injectable()
export class GooglePlacesClient {
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('GOOGLE_PLACES_API_KEY');
  }

  async nearbySearchAll(
    lat: number,
    lon: number,
    query: string,
    isKeyword: boolean,
  ): Promise<NearbyPlace[]> {
    const all: NearbyPlace[] = [];
    let pageToken: string | undefined;
    let page = 0;

    do {
      if (page > 0) await sleep(SCRAPER_CONFIG.NEXT_PAGE_DELAY_MS);

      const data = await this.withRetry(async () => {
        let url: string;
        if (pageToken) {
          url = `${BASE}/nearbysearch/json?pagetoken=${encodeURIComponent(pageToken)}&key=${this.apiKey}`;
        } else if (isKeyword) {
          url = `${BASE}/nearbysearch/json?location=${lat},${lon}&radius=${SCRAPER_CONFIG.RADIUS_M}&keyword=${encodeURIComponent(query)}&key=${this.apiKey}`;
        } else {
          url = `${BASE}/nearbysearch/json?location=${lat},${lon}&radius=${SCRAPER_CONFIG.RADIUS_M}&type=${query}&key=${this.apiKey}`;
        }

        const result = (await httpGet(url)) as NearbyResponse;
        if (result.status === 'OVER_QUERY_LIMIT') throw new Error('OVER_QUERY_LIMIT');
        if (!['OK', 'ZERO_RESULTS'].includes(result.status)) {
          throw new Error(
            `API error: ${result.status}${result.error_message ? ' – ' + result.error_message : ''}`,
          );
        }
        return result;
      });

      all.push(...(data.results ?? []));
      pageToken = data.next_page_token;
      page++;
    } while (pageToken && page < 3);

    return all;
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    await sleep(SCRAPER_CONFIG.REQUEST_DELAY_MS);

    return this.withRetry(async () => {
      const url = `${BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${SCRAPER_CONFIG.DETAILS_FIELDS}&language=fr&key=${this.apiKey}`;
      const data = (await httpGet(url)) as DetailsResponse;
      if (data.status === 'OVER_QUERY_LIMIT') throw new Error('OVER_QUERY_LIMIT');
      if (data.status !== 'OK') return null;
      return data.result ?? null;
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const delays = SCRAPER_CONFIG.RETRY_DELAYS_MS;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await fn();
      } catch (err: unknown) {
        if (attempt === delays.length) throw err;
        const msg = err instanceof Error ? err.message : String(err);
        const isRetryable = msg.includes('OVER_QUERY_LIMIT') || msg.includes('timeout');
        if (!isRetryable) throw err;
        await sleep(delays[attempt as 0 | 1 | 2]);
      }
    }
    throw new Error('unreachable');
  }
}
