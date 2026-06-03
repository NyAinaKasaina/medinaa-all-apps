import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalEntity } from './entities/medical-entity.entity';
import { QueryPlacesDto } from './dto/query-places.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(MedicalEntity)
    private readonly repo: Repository<MedicalEntity>,
  ) {}

  async findAll(query: QueryPlacesDto) {
    const { page = 1, limit = 50, q, type, city } = query;

    const qb = this.repo.createQueryBuilder('e');

    if (q) {
      qb.andWhere('e.name ILIKE :q', { q: `%${q}%` });
    }
    if (type) {
      qb.andWhere('(e.amenity = :type OR e.healthcare = :type)', { type });
    }
    if (city) {
      qb.andWhere('e.addr_city ILIKE :city', { city: `%${city}%` });
    }

    const [items, total] = await qb
      .orderBy('e.name', 'ASC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<MedicalEntity> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Entité ${id} introuvable`);
    return entity;
  }

  async upsert(data: Partial<MedicalEntity>): Promise<MedicalEntity> {
    const existing = await this.repo.findOneBy({ osmId: data.osmId });
    if (existing) return this.repo.save(Object.assign(existing, data));
    return this.repo.save(this.repo.create(data));
  }

  async stats() {
    const total = await this.repo.count();
    const withPhone   = await this.repo.createQueryBuilder('e').where('e.phone IS NOT NULL').getCount();
    const withWebsite = await this.repo.createQueryBuilder('e').where('e.website IS NOT NULL').getCount();
    const withHours   = await this.repo.createQueryBuilder('e').where('e.opening_hours IS NOT NULL').getCount();

    const rows: Array<{ type: string; count: string }> = await this.repo.query(`
      SELECT COALESCE(amenity, healthcare, 'autre') AS type, COUNT(*) AS count
      FROM medical_entities
      WHERE amenity IS NOT NULL OR healthcare IS NOT NULL
      GROUP BY COALESCE(amenity, healthcare, 'autre')
      ORDER BY count DESC
      LIMIT 20
    `);

    const byType: Record<string, number> = {};
    for (const row of rows) byType[row.type] = Number(row.count);

    return { total, withPhone, withWebsite, withHours, byType };
  }
}
