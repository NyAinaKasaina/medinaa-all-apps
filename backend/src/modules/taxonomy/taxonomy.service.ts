import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalCategory } from './entities/medical-category.entity';
import { MedicalType } from './entities/medical-type.entity';

@Injectable()
export class TaxonomyService {
  constructor(
    @InjectRepository(MedicalCategory)
    private readonly categories: Repository<MedicalCategory>,
    @InjectRepository(MedicalType)
    private readonly types: Repository<MedicalType>,
  ) {}

  async tree() {
    return this.categories.find({
      relations: { types: true },
      order: { sortOrder: 'ASC', types: { sortOrder: 'ASC' } },
    });
  }

  async allTypes() {
    return this.types.find({ order: { categorySlug: 'ASC', sortOrder: 'ASC' } });
  }
}
