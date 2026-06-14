import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { District } from './district.entity';

@Entity('communes')
export class Commune {
  @PrimaryColumn()
  id: number;

  @Column({ name: 'district_id', type: 'smallint' })
  districtId: number;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'district_id' })
  district: District;

  @Column({ nullable: true })
  code: string;

  @Column()
  name: string;
}
