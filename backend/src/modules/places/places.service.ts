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
    const { page = 1, limit = 50, q, type, status } = query;

    const qb = this.repo.createQueryBuilder('e');

    if (q) {
      qb.andWhere(
        '(e.name ILIKE :q OR e.vicinity ILIKE :q OR e.formatted_address ILIKE :q)',
        { q: `%${q}%` },
      );
    }
    if (type) {
      qb.andWhere(':type = ANY(e.types)', { type });
    }
    if (status) {
      qb.andWhere('e.business_status = :status', { status });
    }

    const [items, total] = await qb
      .orderBy('e.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<MedicalEntity> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Entité ${id} introuvable`);
    return entity;
  }

  async upsert(data: Partial<MedicalEntity>): Promise<MedicalEntity> {
    const existing = await this.repo.findOneBy({ placeId: data.placeId });
    if (existing) {
      return this.repo.save(Object.assign(existing, data));
    }
    return this.repo.save(this.repo.create(data));
  }

  async stats() {
    const total = await this.repo.count();
    const withPhone = await this.repo
      .createQueryBuilder('e')
      .where('e.phone_number IS NOT NULL')
      .getCount();
    const withWebsite = await this.repo
      .createQueryBuilder('e')
      .where('e.website IS NOT NULL')
      .getCount();
    const withHours = await this.repo
      .createQueryBuilder('e')
      .where('e.opening_hours IS NOT NULL')
      .getCount();

    const byType: Record<string, number> = {};
    const rows: Array<{ type: string; count: string }> = await this.repo.query(`
      SELECT unnest(types) AS type, COUNT(*) AS count
      FROM medical_entities
      GROUP BY type
      ORDER BY count DESC
    `);
    for (const row of rows) {
      byType[row.type] = Number(row.count);
    }

    return { total, withPhone, withWebsite, withHours, byType };
  }
}
