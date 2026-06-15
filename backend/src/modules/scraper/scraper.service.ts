import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ScrapeJob, ScrapeJobStatus } from './entities/scrape-job.entity';
import { ScrapeError } from './entities/scrape-error.entity';
import { PlacesService } from '../places/places.service';
import { OverpassClient } from './utils/overpass.client';
import { BATCH_SIZE } from '../../common/config/scraper.config';
import type { OsmElement } from '../../common/types';

const execFileAsync = promisify(execFile);

// Étapes du pipeline « scrap + mise à jour en une passe », exposées à l'UI.
export type ScrapePhase =
  | 'idle' | 'scrap' | 'reclassification' | 'purge' | 'geocodage' | 'done' | 'failed';

// Post-traitement déterministe rejoué après chaque scrap. Ces SQL ne touchent QUE les lignes
// `classification_status='unverified'` (008 purge par géo) : la curation manuelle est préservée.
const RECLASSIFY_SQL = ['004_map_osm_to_types.sql', '007_classify_more.sql', '009_taxonomy_extend.sql'];
const PURGE_SQL = '008_purge_hors_mdg.sql';
const GEO_FILES = ['mdg-ADM1.geojson', 'mdg-ADM2.geojson', 'mdg-ADM3.geojson', 'mdg-ADM4.geojson'];

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
  private phase: ScrapePhase = 'idle'; // étape courante du pipeline (en mémoire, exposée par /status)

  constructor(
    @InjectRepository(ScrapeJob)
    private readonly jobRepo: Repository<ScrapeJob>,
    @InjectRepository(ScrapeError)
    private readonly errorRepo: Repository<ScrapeError>,
    private readonly placesService: PlacesService,
    private readonly overpass: OverpassClient,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getPhase(): ScrapePhase {
    return this.phase;
  }

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
    this.phase = 'scrap';

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

      // ---- Mise à jour en une passe : curation déterministe + géocodage ----
      // Le scrap a inséré/rafraîchi les données OSM brutes ; on enchaîne le post-traitement
      // (reclassification des 'unverified', purge hors-MDG, géocodage) sans 2e action manuelle.
      await this.runPostProcess();

      job.status = ScrapeJobStatus.DONE;
      job.savedNodes = elements.length;
      job.lastUpdatedAt = new Date();
      await this.jobRepo.save(job);
      this.phase = 'done';
      this.logger.log(`Job ${job.id} terminé: ${job.savedNodes} entités + mise à jour`);
    } catch (err: unknown) {
      this.phase = 'failed';
      job.status = ScrapeJobStatus.FAILED;
      job.lastUpdatedAt = new Date();
      await this.jobRepo.save(job);
      throw err;
    } finally {
      this.isRunning = false;
    }
  }

  // ---- Post-traitement « mise à jour » enchaîné après le scrap ----
  // Chaque étape est isolée : un échec de curation/géocodage n'invalide pas les données brutes
  // déjà sauvegardées (le job finit DONE, l'étape ratée est seulement loguée).
  private async runPostProcess(): Promise<void> {
    try {
      this.phase = 'reclassification';
      for (const file of RECLASSIFY_SQL) await this.runSqlFile(file);
    } catch (err) {
      this.logger.error(`Reclassification échouée (données brutes conservées) : ${(err as Error).message}`);
    }
    try {
      this.phase = 'purge';
      await this.runSqlFile(PURGE_SQL);
    } catch (err) {
      this.logger.error(`Purge hors-MDG échouée : ${(err as Error).message}`);
    }
    try {
      this.phase = 'geocodage';
      await this.geocode();
    } catch (err) {
      this.logger.error(`Géocodage échoué (codes géo inchangés) : ${(err as Error).message}`);
    }
  }

  // Exécute un script SQL de migration via la connexion TypeORM (pas de dépendance à `psql`).
  private async runSqlFile(file: string): Promise<void> {
    const full = path.join(process.cwd(), 'src', 'migrations', file);
    if (!fs.existsSync(full)) {
      this.logger.warn(`SQL de curation introuvable, étape sautée : ${full}`);
      return;
    }
    await this.dataSource.query(fs.readFileSync(full, 'utf8'));
    this.logger.log(`Curation appliquée : ${file}`);
  }

  // Géocodage point-in-polygon (script .cjs séparé). Sauté proprement si les GeoJSON locaux
  // (170 Mo, gitignorés) ou le script sont absents : les codes géo existants restent intacts.
  private async geocode(): Promise<void> {
    const geoDir = path.join(process.cwd(), 'data', 'geo');
    const missing = GEO_FILES.filter((f) => !fs.existsSync(path.join(geoDir, f)));
    const script = path.join(process.cwd(), 'scripts', 'geo-enrich.cjs');
    if (missing.length > 0 || !fs.existsSync(script)) {
      this.logger.warn(
        `Géocodage sauté : ${missing.length ? 'GeoJSON manquants (' + missing.join(', ') + ')' : 'script absent'}`,
      );
      return;
    }
    this.logger.log('Géocodage des entités (point-in-polygon)…');
    const { stdout } = await execFileAsync('node', ['--max-old-space-size=4096', script], {
      cwd: process.cwd(),
      maxBuffer: 16 * 1024 * 1024,
      timeout: 10 * 60_000,
      env: process.env,
    });
    this.logger.log(`Géocodage terminé. ${stdout.trim().split('\n').slice(-4).join(' | ')}`);
  }
}
