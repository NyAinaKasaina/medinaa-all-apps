import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PlacesModule } from './modules/places/places.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { ExportModule } from './modules/export/export.module';
import { MedicalEntity } from './modules/places/entities/medical-entity.entity';
import { ScrapeJob } from './modules/scraper/entities/scrape-job.entity';
import { ScrapeError } from './modules/scraper/entities/scrape-error.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.getOrThrow('DB_USER'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.getOrThrow('DB_NAME'),
        entities: [MedicalEntity, ScrapeJob, ScrapeError],
        migrations: ['dist/migrations/*.js'],
        // synchronize auto-crée les tables en développement
        // Passer à false et utiliser les migrations en production
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    ScheduleModule.forRoot(),

    PlacesModule,
    ScraperModule,
    ExportModule,
  ],
})
export class AppModule {}
