import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalEntity } from './entities/medical-entity.entity';
import { MedicalType } from '../taxonomy/entities/medical-type.entity';
import { Fokontany } from '../geo/entities/fokontany.entity';
import { QueryPlacesDto } from './dto/query-places.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(MedicalEntity)
    private readonly repo: Repository<MedicalEntity>,
    @InjectRepository(MedicalType)
    private readonly types: Repository<MedicalType>,
    @InjectRepository(Fokontany)
    private readonly fokontany: Repository<Fokontany>,
  ) {}

  // Résout les noms administratifs (faritra/distrika/kaominina/fokontany) au niveau le plus profond connu.
  private async resolveGeo(e: MedicalEntity) {
    let row: Fokontany | null = null;
    if (e.codeFokontany) row = await this.fokontany.findOneBy({ codeFokontany: e.codeFokontany });
    else if (e.codeKaominina) row = await this.fokontany.findOneBy({ codeKaominina: e.codeKaominina });
    else if (e.codeDistrika) row = await this.fokontany.findOneBy({ codeDistrika: e.codeDistrika });
    else if (e.codeFaritra) row = await this.fokontany.findOneBy({ codeFaritra: e.codeFaritra });
    if (!row) return null;
    const geo: Record<string, { code: string; nom: string }> = {};
    if (e.codeFaritra) geo.faritra = { code: e.codeFaritra, nom: row.nomFaritra };
    if (e.codeDistrika) geo.distrika = { code: e.codeDistrika, nom: row.nomDistrika };
    if (e.codeKaominina) geo.kaominina = { code: e.codeKaominina, nom: row.nomKaominina };
    if (e.codeFokontany) geo.fokontany = { code: e.codeFokontany, nom: row.nomFokontany };
    return geo;
  }

  async findAll(query: QueryPlacesDto) {
    const { page = 1, limit = 50, q, type, category, faritra, distrika, kaominina, status, geo, city } = query;

    const qb = this.repo.createQueryBuilder('e');

    if (q) {
      qb.andWhere('e.name ILIKE :q', { q: `%${q}%` });
    }
    if (category) {
      qb.andWhere('e.category_slug = :category', { category });
    }
    if (type) {
      // Nouveau type_slug, avec repli sur les tags OSM legacy pendant la transition.
      qb.andWhere('(e.type_slug = :type OR e.amenity = :type OR e.healthcare = :type)', { type });
    }
    if (faritra) {
      qb.andWhere('e.code_faritra = :faritra', { faritra });
    }
    if (distrika) {
      qb.andWhere('e.code_distrika = :distrika', { distrika });
    }
    if (kaominina) {
      qb.andWhere('e.code_kaominina = :kaominina', { kaominina });
    }
    if (status) {
      qb.andWhere('e.classification_status = :status', { status });
    }
    if (geo === 'located') {
      qb.andWhere('e.code_faritra IS NOT NULL');
    } else if (geo === 'missing') {
      qb.andWhere('e.code_faritra IS NULL');
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

  // FeatureCollection GeoJSON pour la carte (tous les points, ou filtrés par catégorie).
  async geojson(category?: string) {
    const qb = this.repo
      .createQueryBuilder('e')
      .select(['e.id', 'e.name', 'e.lat', 'e.lng', 'e.categorySlug', 'e.typeSlug', 'e.phone', 'e.openingHours', 'e.classificationStatus'])
      .where('e.lat IS NOT NULL AND e.lng IS NOT NULL');
    if (category) qb.andWhere('e.category_slug = :category', { category });
    const rows = await qb.getMany();
    return {
      type: 'FeatureCollection',
      features: rows.map((e) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [e.lng, e.lat] },
        properties: {
          id: e.id,
          name: e.name,
          categorySlug: e.categorySlug,
          typeSlug: e.typeSlug,
          phone: e.phone,
          openingHours: e.openingHours,
          classificationStatus: e.classificationStatus,
        },
      })),
    };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Entité ${id} introuvable`);
    return { ...entity, geo: await this.resolveGeo(entity) };
  }

  async upsert(data: Partial<MedicalEntity>): Promise<MedicalEntity> {
    const existing = await this.repo.findOneBy({ osmId: data.osmId });
    if (existing) return this.repo.save(Object.assign(existing, data));
    return this.repo.save(this.repo.create(data));
  }

  async claimPlace(id: string, userId: string): Promise<MedicalEntity> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Entité ${id} introuvable`);
    if (entity.ownerId) throw new ConflictException('Already claimed');
    entity.ownerId = userId;
    return this.repo.save(entity);
  }

  async updateByOwner(id: string, userId: string, data: UpdatePlaceDto): Promise<MedicalEntity> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Entité ${id} introuvable`);
    if (entity.ownerId !== userId) throw new ForbiddenException('Not the owner');

    const { typeSlug, ...rest } = data;
    Object.assign(entity, rest);

    // Curation : quand le propriétaire fixe le type, on dérive la catégorie et on valide.
    if (typeSlug !== undefined) {
      if (typeSlug === null) {
        entity.typeSlug = null;
        entity.categorySlug = null;
        entity.classificationStatus = 'unverified';
      } else {
        const t = await this.types.findOneBy({ slug: typeSlug });
        if (!t) throw new BadRequestException(`Type inconnu : ${typeSlug}`);
        entity.typeSlug = t.slug;
        entity.categorySlug = t.categorySlug;
        entity.classificationStatus = 'verified';
      }
    }

    return this.repo.save(entity);
  }

  async getByOwner(userId: string): Promise<MedicalEntity[]> {
    return this.repo.findBy({ ownerId: userId });
  }

  async stats() {
    const total = await this.repo.count();
    const withPhone   = await this.repo.createQueryBuilder('e').where('e.phone IS NOT NULL').getCount();
    const withWebsite = await this.repo.createQueryBuilder('e').where('e.website IS NOT NULL').getCount();
    const withHours   = await this.repo.createQueryBuilder('e').where('e.opening_hours IS NOT NULL').getCount();
    const unverified  = await this.repo.createQueryBuilder('e').where("e.classification_status = 'unverified'").getCount();

    const byCategoryRows: Array<{ slug: string; count: string }> = await this.repo.query(`
      SELECT category_slug AS slug, COUNT(*) AS count
      FROM medical_entities WHERE category_slug IS NOT NULL
      GROUP BY category_slug ORDER BY count DESC
    `);
    const byTypeRows: Array<{ slug: string; count: string }> = await this.repo.query(`
      SELECT type_slug AS slug, COUNT(*) AS count
      FROM medical_entities WHERE type_slug IS NOT NULL
      GROUP BY type_slug ORDER BY count DESC
    `);

    const byCategory: Record<string, number> = {};
    for (const row of byCategoryRows) byCategory[row.slug] = Number(row.count);
    const byType: Record<string, number> = {};
    for (const row of byTypeRows) byType[row.slug] = Number(row.count);

    const byFaritraRows: Array<{ code: string; nom: string; count: string }> = await this.repo.query(`
      SELECT m.code_faritra AS code, f.nom AS nom, COUNT(*) AS count
      FROM medical_entities m
      JOIN (SELECT DISTINCT code_faritra, nom_faritra AS nom FROM fokontany) f ON f.code_faritra = m.code_faritra
      WHERE m.code_faritra IS NOT NULL
      GROUP BY m.code_faritra, f.nom
      ORDER BY count DESC
    `);
    const byFaritra = byFaritraRows.map((r) => ({ code: r.code, nom: r.nom, count: Number(r.count) }));

    // Qualité des données : répartition par statut de classification + complétude géo / nom
    const statusRows: Array<{ status: string; count: string }> = await this.repo.query(
      `SELECT classification_status AS status, COUNT(*) AS count FROM medical_entities GROUP BY classification_status`,
    );
    const byStatus: Record<string, number> = {};
    for (const r of statusRows) byStatus[r.status] = Number(r.count);

    const q: { faritra: string; distrika: string; kaominina: string; fokontany: string; named: string } = (
      await this.repo.query(`
        SELECT
          COUNT(*) FILTER (WHERE code_faritra   IS NOT NULL) AS faritra,
          COUNT(*) FILTER (WHERE code_distrika  IS NOT NULL) AS distrika,
          COUNT(*) FILTER (WHERE code_kaominina IS NOT NULL) AS kaominina,
          COUNT(*) FILTER (WHERE code_fokontany IS NOT NULL) AS fokontany,
          COUNT(*) FILTER (WHERE name           IS NOT NULL) AS named
        FROM medical_entities
      `)
    )[0];
    const geo = { faritra: Number(q.faritra), distrika: Number(q.distrika), kaominina: Number(q.kaominina), fokontany: Number(q.fokontany) };
    const withName = Number(q.named);

    return { total, withPhone, withWebsite, withHours, withName, unverified, byStatus, byCategory, byType, byFaritra, geo };
  }
}
