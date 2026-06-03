import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalEntity } from '../places/entities/medical-entity.entity';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalEntity])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
