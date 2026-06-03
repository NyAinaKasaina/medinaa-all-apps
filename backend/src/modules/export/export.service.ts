import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalEntity } from '../places/entities/medical-entity.entity';

function csvCell(v: string | number | boolean | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

const CSV_HEADERS = [
  'osm_id', 'osm_type', 'name', 'name_mg', 'amenity', 'healthcare',
  'lat', 'lng', 'phone', 'website', 'opening_hours',
  'addr_street', 'addr_housenumber', 'addr_city', 'addr_district', 'addr_province',
  'operator', 'operator_type', 'beds', 'emergency', 'osm_url', 'scraped_at',
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
        e.osmId, e.osmType, e.name, e.nameMg,
        e.amenity, e.healthcare,
        e.lat, e.lng,
        e.phone, e.website, e.openingHours,
        e.addrStreet, e.addrHousenumber, e.addrCity, e.addrDistrict, e.addrProvince,
        e.operator, e.operatorType, e.beds, e.emergency,
        e.osmUrl, e.scrapedAt?.toISOString(),
      ].map(csvCell).join(','),
    );

    return [CSV_HEADERS.join(','), ...rows].join('\n');
  }
}
