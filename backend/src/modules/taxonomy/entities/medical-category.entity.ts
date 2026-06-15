import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { MedicalType } from './medical-type.entity';

@Entity('medical_categories')
export class MedicalCategory {
  @PrimaryColumn()
  slug: string;

  @Column({ name: 'label_fr' })
  labelFr: string;

  @Column({ name: 'label_mg', nullable: true })
  labelMg: string;

  @Column({ name: 'label_en', nullable: true })
  labelEn: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  icon: string;

  @OneToMany(() => MedicalType, (t) => t.category)
  types: MedicalType[];
}
