import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScrapeError } from './scrape-error.entity';

export enum ScrapeJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('scrape_jobs')
export class ScrapeJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: ScrapeJobStatus.PENDING })
  status: ScrapeJobStatus;

  @Column({ type: 'smallint', default: 1 })
  phase: number;

  @Column({ name: 'total_queries', default: 0 })
  totalQueries: number;

  @Column({ name: 'processed_queries_count', default: 0 })
  processedQueriesCount: number;

  @Column({ name: 'collected_place_ids_count', default: 0 })
  collectedPlaceIdsCount: number;

  @Column({ name: 'enriched_place_ids_count', default: 0 })
  enrichedPlaceIdsCount: number;

  // Tableaux pour la reprise — mis à jour toutes les 50 itérations
  @Column('text', { array: true, name: 'processed_query_keys', default: [] })
  processedQueryKeys: string[];

  @Column('text', { array: true, name: 'collected_ids', default: [] })
  collectedIds: string[];

  @Column('text', { array: true, name: 'enriched_ids', default: [] })
  enrichedIds: string[];

  @Column({ nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ nullable: true, name: 'last_updated_at' })
  lastUpdatedAt: Date;

  @OneToMany(() => ScrapeError, (e) => e.scrapeJob, { cascade: true })
  errors: ScrapeError[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
