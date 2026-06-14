import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';
import { District } from './entities/district.entity';

@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(Region)
    private readonly regions: Repository<Region>,
    @InjectRepository(District)
    private readonly districts: Repository<District>,
  ) {}

  allRegions() {
    return this.regions.find({ order: { name: 'ASC' } });
  }

  districtsOf(regionId: number) {
    return this.districts.find({ where: { regionId }, order: { name: 'ASC' } });
  }
}
