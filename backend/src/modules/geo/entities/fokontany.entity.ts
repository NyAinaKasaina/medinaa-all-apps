import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Commune } from './commune.entity';

@Entity('fokontany')
export class Fokontany {
  @PrimaryColumn()
  id: number;

  @Column({ name: 'commune_id' })
  communeId: number;

  @ManyToOne(() => Commune)
  @JoinColumn({ name: 'commune_id' })
  commune: Commune;

  @Column({ nullable: true })
  code: string;

  @Column()
  name: string;
}
