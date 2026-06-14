import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('regions')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des régions de Madagascar' })
  regions() {
    return this.geo.allRegions();
  }

  @Get(':id/districts')
  @ApiOperation({ summary: 'Districts d\'une région' })
  districts(@Param('id', ParseIntPipe) id: number) {
    return this.geo.districtsOf(id);
  }
}
