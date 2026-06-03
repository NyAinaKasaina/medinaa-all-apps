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
  PAUSED  = 'paused',
  DONE    = 'done',
  FAILED  = 'failed',
}

@Entity('scrape_jobs')
export class ScrapeJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: ScrapeJobStatus.PENDING })
  status: ScrapeJobStatus;

  @Column({ default: 0, name: 'total_nodes' })
  totalNodes: number;

  @Column({ default: 0, name: 'saved_nodes' })
  savedNodes: number;

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
