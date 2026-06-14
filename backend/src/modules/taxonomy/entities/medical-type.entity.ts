import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MedicalCategory } from './medical-category.entity';

@Entity('medical_types')
export class MedicalType {
  @PrimaryColumn()
  slug: string;

  @Column({ name: 'category_slug' })
  categorySlug: string;

  @ManyToOne(() => MedicalCategory, (c) => c.types)
  @JoinColumn({ name: 'category_slug' })
  category: MedicalCategory;

  @Column({ name: 'label_fr' })
  labelFr: string;

  @Column({ name: 'label_mg', nullable: true })
  labelMg: string;

  @Column({ name: 'label_en', nullable: true })
  labelEn: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;
}
