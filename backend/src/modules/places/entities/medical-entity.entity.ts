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
  @Column({ name: 'place_id' })
  placeId: string;

  @Column()
  name: string;

  @Column({ nullable: true, name: 'formatted_address' })
  formattedAddress: string;

  @Column({ nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ nullable: true, name: 'international_phone_number' })
  internationalPhoneNumber: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'real', nullable: true })
  rating: number;

  @Column({ nullable: true, name: 'user_ratings_total' })
  userRatingsTotal: number;

  @Column('text', { array: true, nullable: true })
  types: string[];

  @Column({ type: 'double precision', nullable: true })
  lat: number;

  @Column({ type: 'double precision', nullable: true })
  lng: number;

  @Column({ nullable: true })
  vicinity: string;

  @Column({ nullable: true, name: 'google_maps_url' })
  googleMapsUrl: string;

  @Column({ nullable: true, name: 'business_status' })
  businessStatus: string;

  @Column({ type: 'jsonb', nullable: true, name: 'opening_hours' })
  openingHours: { open_now?: boolean; weekday_text?: string[] } | null;

  @Column({ nullable: true, name: 'scraped_at' })
  scrapedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
