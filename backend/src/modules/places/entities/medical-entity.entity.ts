import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('medical_entities')
export class MedicalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'osm_id' })
  osmId: string;

  @Column({ name: 'osm_type' })
  osmType: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, name: 'name_mg' })
  nameMg: string;

  @Column({ nullable: true })
  amenity: string;

  @Column({ nullable: true })
  healthcare: string;

  @Column({ nullable: true, name: 'health_facility_type' })
  healthFacilityType: string;

  @Column({ type: 'double precision', nullable: true })
  lat: number;

  @Column({ type: 'double precision', nullable: true })
  lng: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true, name: 'opening_hours' })
  openingHours: string;

  @Column({ nullable: true, name: 'addr_street' })
  addrStreet: string;

  @Column({ nullable: true, name: 'addr_housenumber' })
  addrHousenumber: string;

  @Column({ nullable: true, name: 'addr_city' })
  addrCity: string;

  @Column({ nullable: true, name: 'addr_district' })
  addrDistrict: string;

  @Column({ nullable: true, name: 'addr_province' })
  addrProvince: string;

  @Column({ nullable: true })
  operator: string;

  @Column({ nullable: true, name: 'operator_type' })
  operatorType: string;

  @Column({ nullable: true })
  beds: number;

  @Column({ nullable: true })
  emergency: boolean;

  @Column({ nullable: true, name: 'osm_url' })
  osmUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: Record<string, string>;

  @Column({ type: 'varchar', nullable: true, default: null, name: 'owner_id' })
  ownerId: string | null;

  // Taxonomie médicale (réorg 2026-06-13). type_slug NULL = à classifier.
  @Column({ type: 'varchar', nullable: true, name: 'type_slug' })
  typeSlug: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'category_slug' })
  categorySlug: string | null;

  @Column({ name: 'classification_status', default: 'unverified' })
  classificationStatus: string;

  // Hiérarchie géographique (Région > District > Commune > Fokontany)
  @Column({ type: 'smallint', nullable: true, name: 'region_id' })
  regionId: number | null;

  @Column({ type: 'smallint', nullable: true, name: 'district_id' })
  districtId: number | null;

  @Column({ type: 'int', nullable: true, name: 'commune_id' })
  communeId: number | null;

  @Column({ type: 'int', nullable: true, name: 'fokontany_id' })
  fokontanyId: number | null;

  @Column({ nullable: true, name: 'scraped_at' })
  scrapedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
