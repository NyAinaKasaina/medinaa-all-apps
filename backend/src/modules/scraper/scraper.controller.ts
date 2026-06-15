import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';

@ApiTags('scraper')
@Controller('scraper')
export class ScraperController {
  constructor(private readonly service: ScraperService) {}

  @Post('start')
  @ApiOperation({ summary: 'Démarre ou reprend le scrape Google Places' })
  start() {
    return this.service.start();
  }

  @Post('pause')
  @ApiOperation({ summary: 'Met en pause le scrape en cours (reprend après la requête active)' })
  pause() {
    return this.service.pause();
  }

  @Get('status')
  @ApiOperation({ summary: 'Statut du dernier job (avec les erreurs) + phase du pipeline' })
  async status() {
    const job = await this.service.getStatus();
    // `phase` (en mémoire) reflète l'étape courante : scrap -> reclassification -> purge -> géocodage.
    return { job: job ? { ...job, phase: this.service.getPhase() } : null };
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Historique de tous les jobs' })
  listJobs() {
    return this.service.listJobs();
  }
}
