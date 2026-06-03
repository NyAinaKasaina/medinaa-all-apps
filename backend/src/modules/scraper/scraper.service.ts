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
import { GooglePlacesClient } from './utils/google-places.client';
import { generateGrid } from './utils/grid.generator';
import { SCRAPER_CONFIG } from '../../common/config/scraper.config';

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
    private readonly client: GooglePlacesClient,
  ) {}

  async onApplicationBootstrap() {
    // Remet en PAUSED les jobs qui seraient restés RUNNING après un crash
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

    // Reprend un job en pause ou pending, sinon crée un nouveau
    let job = await this.jobRepo.findOne({
      where: [
        { status: ScrapeJobStatus.PAUSED },
        { status: ScrapeJobStatus.PENDING },
      ],
      order: { createdAt: 'DESC' },
    });

    if (!job) {
      const grid = generateGrid();
      const totalQueries =
        grid.length * (SCRAPER_CONFIG.PLACE_TYPES.length + SCRAPER_CONFIG.KEYWORDS.length);
      job = await this.jobRepo.save(
        this.jobRepo.create({
          status: ScrapeJobStatus.PENDING,
          phase: 1,
          totalQueries,
          processedQueryKeys: [],
          collectedIds: [],
          enrichedIds: [],
        }),
      );
      this.logger.log(`Nouveau job créé: ${job.id} — ${totalQueries} requêtes prévues`);
    } else {
      this.logger.log(`Reprise du job ${job.id} (phase ${job.phase})`);
    }

    job.status = ScrapeJobStatus.RUNNING;
    job.startedAt = job.startedAt ?? new Date();
    await this.jobRepo.save(job);

    this.runScrape(job).catch((err: Error) =>
      this.logger.error(`Job ${job!.id} échoué: ${err.message}`, err.stack),
    );

    return { job, message: 'Scrape démarré' };
  }

  async pause(): Promise<{ message: string }> {
    if (!this.isRunning) {
      return { message: 'Aucun scrape en cours' };
    }
    this.shouldPause = true;
    return { message: 'Pause demandée, arrêt après la requête en cours...' };
  }

  private async runScrape(job: ScrapeJob): Promise<void> {
    this.isRunning = true;
    this.shouldPause = false;

    try {
      if (job.phase === 1) {
        await this.runPhase1(job);
        if (job.status === ScrapeJobStatus.PAUSED) return;
        job.phase = 2;
        await this.jobRepo.save(job);
      }

      await this.runPhase2(job);

      if (job.status !== ScrapeJobStatus.PAUSED) {
        job.status = ScrapeJobStatus.DONE;
        job.lastUpdatedAt = new Date();
        await this.jobRepo.save(job);
        this.logger.log(`Job ${job.id} terminé: ${job.enrichedPlaceIdsCount} entités sauvegardées`);
      }
    } catch (err: unknown) {
      job.status = ScrapeJobStatus.FAILED;
      await this.jobRepo.save(job);
      throw err;
    } finally {
      this.isRunning = false;
    }
  }

  private async runPhase1(job: ScrapeJob): Promise<void> {
    const grid = generateGrid();
    const processedSet = new Set(job.processedQueryKeys);
    const placeIdSet = new Set(job.collectedIds);

    const allQueries = grid.flatMap((pt) => [
      ...SCRAPER_CONFIG.PLACE_TYPES.map((t) => ({ pt, query: t, isKeyword: false })),
      ...SCRAPER_CONFIG.KEYWORDS.map((kw) => ({ pt, query: kw, isKeyword: true })),
    ]);

    let sinceLastFlush = 0;

    for (const { pt, query, isKeyword } of allQueries) {
      if (this.shouldPause) {
        await this.flushJob(job, processedSet, placeIdSet, null);
        job.status = ScrapeJobStatus.PAUSED;
        await this.jobRepo.save(job);
        return;
      }

      const key = `${pt.lat},${pt.lon}:${isKeyword ? 'kw:' : ''}${query}`;
      if (processedSet.has(key)) continue;

      try {
        const results = await this.client.nearbySearchAll(pt.lat, pt.lon, query, isKeyword);
        for (const r of results) placeIdSet.add(r.place_id);
        processedSet.add(key);
        sinceLastFlush++;
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        await this.errorRepo.save(
          this.errorRepo.create({ scrapeJob: job, queryKey: key, error }),
        );
      }

      if (sinceLastFlush >= 50) {
        await this.flushJob(job, processedSet, placeIdSet, null);
        sinceLastFlush = 0;
      }
    }

    await this.flushJob(job, processedSet, placeIdSet, null);
    this.logger.log(`Phase 1 terminée: ${placeIdSet.size} IDs collectés`);
  }

  private async runPhase2(job: ScrapeJob): Promise<void> {
    const enrichedSet = new Set(job.enrichedIds);
    const unenriched = job.collectedIds.filter((id) => !enrichedSet.has(id));

    this.logger.log(`Phase 2: ${unenriched.length} entités à enrichir`);
    let sinceLastFlush = 0;

    for (const placeId of unenriched) {
      if (this.shouldPause) {
        await this.flushJob(job, null, null, enrichedSet);
        job.status = ScrapeJobStatus.PAUSED;
        await this.jobRepo.save(job);
        return;
      }

      try {
        const details = await this.client.getPlaceDetails(placeId);
        if (details) {
          await this.placesService.upsert({
            placeId: details.place_id,
            name: details.name,
            formattedAddress: details.formatted_address,
            phoneNumber: details.formatted_phone_number,
            internationalPhoneNumber: details.international_phone_number,
            website: details.website,
            rating: details.rating,
            userRatingsTotal: details.user_ratings_total,
            types: details.types,
            lat: details.geometry?.location.lat,
            lng: details.geometry?.location.lng,
            vicinity: details.vicinity,
            googleMapsUrl: details.url,
            businessStatus: details.business_status,
            openingHours: details.opening_hours ?? null,
            scrapedAt: new Date(),
          });
        }
        enrichedSet.add(placeId);
        sinceLastFlush++;
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        await this.errorRepo.save(
          this.errorRepo.create({ scrapeJob: job, queryKey: placeId, error }),
        );
      }

      if (sinceLastFlush >= 50) {
        await this.flushJob(job, null, null, enrichedSet);
        sinceLastFlush = 0;
      }
    }

    await this.flushJob(job, null, null, enrichedSet);
    this.logger.log(`Phase 2 terminée: ${enrichedSet.size} entités sauvegardées`);
  }

  private async flushJob(
    job: ScrapeJob,
    processedSet: Set<string> | null,
    placeIdSet: Set<string> | null,
    enrichedSet: Set<string> | null,
  ): Promise<void> {
    if (processedSet !== null) {
      job.processedQueryKeys = Array.from(processedSet);
      job.processedQueriesCount = processedSet.size;
    }
    if (placeIdSet !== null) {
      job.collectedIds = Array.from(placeIdSet);
      job.collectedPlaceIdsCount = placeIdSet.size;
    }
    if (enrichedSet !== null) {
      job.enrichedIds = Array.from(enrichedSet);
      job.enrichedPlaceIdsCount = enrichedSet.size;
    }
    job.lastUpdatedAt = new Date();
    await this.jobRepo.save(job);
  }
}
