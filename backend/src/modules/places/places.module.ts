import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalEntity } from './entities/medical-entity.entity';
import { MedicalType } from '../taxonomy/entities/medical-type.entity';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { MeController } from './me.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalEntity, MedicalType]), AuthModule],
  controllers: [PlacesController, MeController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
