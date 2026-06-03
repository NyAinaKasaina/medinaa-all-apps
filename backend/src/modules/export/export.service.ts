import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalEntity } from '../places/entities/medical-entity.entity';

function csvCell(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

const CSV_HEADERS = [
  'place_id',
  'name',
  'formatted_address',
  'lat',
  'lng',
  'types',
  'phone_number',
  'international_phone_number',
  'website',
  'rating',
  'user_ratings_total',
  'business_status',
  'opening_hours',
  'google_maps_url',
  'scraped_at',
];

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(MedicalEntity)
    private readonly repo: Repository<MedicalEntity>,
  ) {}

  async toJson(): Promise<MedicalEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async toCsv(): Promise<string> {
    const entities = await this.repo.find({ order: { name: 'ASC' } });

    const rows = entities.map((e) =>
      [
        e.placeId,
        e.name,
        e.formattedAddress ?? e.vicinity ?? '',
        e.lat ?? '',
        e.lng ?? '',
        (e.types ?? []).join('|'),
        e.phoneNumber ?? '',
        e.internationalPhoneNumber ?? '',
        e.website ?? '',
        e.rating ?? '',
        e.userRatingsTotal ?? '',
        e.businessStatus ?? '',
        (e.openingHours?.weekday_text ?? []).join(' | '),
        e.googleMapsUrl ?? '',
        e.scrapedAt?.toISOString() ?? '',
      ]
        .map(csvCell)
        .join(','),
    );

    return [CSV_HEADERS.join(','), ...rows].join('\n');
  }
}
