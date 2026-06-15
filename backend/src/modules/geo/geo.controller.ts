import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('faritra')
  @ApiOperation({ summary: 'Liste des régions (faritra) : code + nom' })
  faritra() {
    return this.geo.faritra();
  }

  @Get('distrika')
  @ApiOperation({ summary: 'Districts (distrika) d\'une région (param faritra=code)' })
  distrika(@Query('faritra') faritra: string) {
    return this.geo.distrika(faritra);
  }

  @Get('kaominina')
  @ApiOperation({ summary: 'Communes (kaominina) d\'un district (param distrika=code)' })
  kaominina(@Query('distrika') distrika: string) {
    return this.geo.kaominina(distrika);
  }
}
