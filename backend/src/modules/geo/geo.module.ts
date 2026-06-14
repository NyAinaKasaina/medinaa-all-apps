import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from './entities/region.entity';
import { District } from './entities/district.entity';
import { Commune } from './entities/commune.entity';
import { Fokontany } from './entities/fokontany.entity';
import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Region, District, Commune, Fokontany])],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [TypeOrmModule],
})
export class GeoModule {}
