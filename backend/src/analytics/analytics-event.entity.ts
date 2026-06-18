import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  locale?: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ nullable: true })
  device?: string;

  @Column({ nullable: true })
  referrer?: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, unknown>;

  @CreateDateColumn()
  created_at: Date;
}
