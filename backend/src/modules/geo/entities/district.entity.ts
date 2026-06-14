import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Region } from './region.entity';

@Entity('districts')
export class District {
  @PrimaryColumn({ type: 'smallint' })
  id: number;

  @Column({ name: 'region_id', type: 'smallint' })
  regionId: number;

  @ManyToOne(() => Region, (r) => r.districts)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @Column({ nullable: true })
  code: string;

  @Column()
  name: string;
}
