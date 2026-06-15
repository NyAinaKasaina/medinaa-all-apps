import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalCategory } from './entities/medical-category.entity';
import { MedicalType } from './entities/medical-type.entity';
import { TaxonomyService } from './taxonomy.service';
import { TaxonomyController } from './taxonomy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalCategory, MedicalType])],
  controllers: [TaxonomyController],
  providers: [TaxonomyService],
  exports: [TypeOrmModule],
})
export class TaxonomyModule {}
