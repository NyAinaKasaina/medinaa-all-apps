import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapeJob } from './entities/scrape-job.entity';
import { ScrapeError } from './entities/scrape-error.entity';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { OverpassClient } from './utils/overpass.client';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScrapeJob, ScrapeError]),
    PlacesModule,
  ],
  controllers: [ScraperController],
  providers: [ScraperService, OverpassClient],
})
export class ScraperModule {}
