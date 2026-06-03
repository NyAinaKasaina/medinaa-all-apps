import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapeJob, ScrapeJobStatus } from './entities/scrape-job.entity';
import { ScrapeError } from './entities/scrape-error.entity';
import { PlacesService } from '../places/places.service';
import { OverpassClient } from './utils/overpass.client';
import { BATCH_SIZE } from '../../common/config/scraper.config';
import type { OsmElement } from '../../common/types';

function parseElement(el: OsmElement) {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;

  const phone =
    tags['phone'] ?? tags['contact:phone'] ?? tags['telephone'] ?? null;
  const website =
    tags['website'] ?? tags['contact:website'] ?? tags['url'] ?? null;

  return {
    osmId: `${el.type}/${el.id}`,
    osmType: el.type,
    name: tags['name'] ?? null,
    nameMg: tags['name:mg'] ?? null,
    amenity: tags['amenity'] ?? null,
    healthcare: tags['healthcare'] ?? null,
    healthFacilityType: tags['health_facility:type'] ?? tags['health_facility_type'] ?? null,
    lat: lat ?? undefined,
    lng: lng ?? undefined,
    phone,
    website,
    openingHours: tags['opening_hours'] ?? null,
    addrStreet: tags['addr:street'] ?? null,
    addrHousenumber: tags['addr:housenumber'] ?? null,
    addrCity: tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'] ?? null,
    addrDistrict: tags['addr:district'] ?? null,
    addrProvince: tags['addr:province'] ?? null,
    operator: tags['operator'] ?? null,
    operatorType: tags['operator:type'] ?? null,
    beds: tags['beds'] ? Number(tags['beds']) : undefined,
    emergency: tags['emergency'] === 'yes' ? true : tags['emergency'] === 'no' ? false : undefined,
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    tags,
    scrapedAt: new Date(),
  };
}

@Injectable()
export class ScraperService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ScraperService.name);
  private isRunning = false;
  private shouldPause = false;

  constructor(
    @InjectRepository(ScrapeJob)
    private readonly jobRepo: Repository<ScrapeJob>,
    @InjectRepository(ScrapeError)
    private readonly errorRepo: Repository<ScrapeError>,
    private readonly placesService: PlacesService,
    private readonly overpass: OverpassClient,
  ) {}

  async onApplicationBootstrap() {
    await this.jobRepo.update(
      { status: ScrapeJobStatus.RUNNING },
      { status: ScrapeJobStatus.PAUSED },
    );
  }

  onApplicationShutdown() {
    this.shouldPause = true;
  }

  async getStatus(): Promise<ScrapeJob | null> {
    const results = await this.jobRepo.find({
      order: { createdAt: 'DESC' },
      take: 1,
      relations: ['errors'],
    });
    return results[0] ?? null;
  }

  async listJobs(): Promise<ScrapeJob[]> {
    return this.jobRepo.find({ order: { createdAt: 'DESC' } });
  }

  async start(): Promise<{ job: ScrapeJob; message: string }> {
    if (this.isRunning) {
      const job = await this.getStatus();
      return { job: job!, message: 'Un scrape est déjà en cours' };
    }

    // Nouveau job à chaque démarrage (Overpass = requête fraîche)
    const job = await this.jobRepo.save(
      this.jobRepo.create({ status: ScrapeJobStatus.RUNNING, startedAt: new Date() }),
    );

    this.runScrape(job).catch((err: Error) =>
      this.logger.error(`Job ${job.id} échoué: ${err.message}`, err.stack),
    );

    return { job, message: 'Scrape OSM démarré' };
  }

  async pause(): Promise<{ message: string }> {
    if (!this.isRunning) return { message: 'Aucun scrape en cours' };
    this.shouldPause = true;
    return { message: 'Pause demandée, arrêt après le batch en cours…' };
  }

  private async runScrape(job: ScrapeJob): Promise<void> {
    this.isRunning = true;
    this.shouldPause = false;

    try {
      // Fetch depuis Overpass
      const elements = await this.overpass.fetchAll();
      job.totalNodes = elements.length;
      job.lastUpdatedAt = new Date();
      await this.jobRepo.save(job);

      // Sauvegarde par batches
      for (let i = 0; i < elements.length; i += BATCH_SIZE) {
        if (this.shouldPause) {
          job.status = ScrapeJobStatus.PAUSED;
          job.lastUpdatedAt = new Date();
          await this.jobRepo.save(job);
          return;
        }

        const batch = elements.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (el) => {
            try {
              await this.placesService.upsert(parseElement(el));
            } catch (err: unknown) {
              const error = err instanceof Error ? err.message : String(err);
              await this.errorRepo.save(
                this.errorRepo.create({ scrapeJob: job, queryKey: `${el.type}/${el.id}`, error }),
              );
            }
          }),
        );

        job.savedNodes = Math.min(i + BATCH_SIZE, elements.length);
        job.lastUpdatedAt = new Date();
        await this.jobRepo.save(job);
      }

      job.status = ScrapeJobStatus.DONE;
      job.savedNodes = elements.length;
      job.lastUpdatedAt = new Date();
      await this.jobRepo.save(job);
      this.logger.log(`Job ${job.id} terminé: ${job.savedNodes} entités sauvegardées`);
    } catch (err: unknown) {
      job.status = ScrapeJobStatus.FAILED;
      job.lastUpdatedAt = new Date();
      await this.jobRepo.save(job);
      throw err;
    } finally {
      this.isRunning = false;
    }
  }
}
