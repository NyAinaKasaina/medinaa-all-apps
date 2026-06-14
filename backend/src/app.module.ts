import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { PlacesModule } from './modules/places/places.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { ExportModule } from './modules/export/export.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MedicalEntity } from './modules/places/entities/medical-entity.entity';
import { ScrapeJob } from './modules/scraper/entities/scrape-job.entity';
import { ScrapeError } from './modules/scraper/entities/scrape-error.entity';
import { User } from './modules/users/user.entity';
import { MedicalCategory } from './modules/taxonomy/entities/medical-category.entity';
import { MedicalType } from './modules/taxonomy/entities/medical-type.entity';
import { Fokontany } from './modules/geo/entities/fokontany.entity';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { GeoModule } from './modules/geo/geo.module';

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
        entities: [
          MedicalEntity, ScrapeJob, ScrapeError, User,
          MedicalCategory, MedicalType, Fokontany,
        ],
        migrations: ['dist/migrations/*.js'],
        // Réorg du schéma en cours : le schéma est géré par les scripts SQL idempotents
        // de backend/src/migrations/ (001-004). synchronize désactivé pour ne pas entrer
        // en conflit avec les contraintes/index posés en SQL.
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    ScheduleModule.forRoot(),

    PlacesModule,
    ScraperModule,
    ExportModule,
    AuthModule,
    UsersModule,
    TaxonomyModule,
    GeoModule,
  ],
})
export class AppModule {}
