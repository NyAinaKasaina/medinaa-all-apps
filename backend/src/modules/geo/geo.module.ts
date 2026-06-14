import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fokontany } from './entities/fokontany.entity';
import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fokontany])],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [TypeOrmModule],
})
export class GeoModule {}
