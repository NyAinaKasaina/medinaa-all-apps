import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { District } from './district.entity';

@Entity('regions')
export class Region {
  @PrimaryColumn({ type: 'smallint' })
  id: number;

  @Column({ nullable: true })
  code: string;

  @Column()
  name: string;

  @OneToMany(() => District, (d) => d.region)
  districts: District[];
}
