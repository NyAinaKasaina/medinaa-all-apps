import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ScrapeJob } from './scrape-job.entity';

@Entity('scrape_errors')
export class ScrapeError {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ScrapeJob, (job) => job.errors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scrape_job_id' })
  scrapeJob: ScrapeJob;

  @Column({ name: 'query_key', nullable: true })
  queryKey: string;

  @Column({ type: 'text' })
  error: string;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
