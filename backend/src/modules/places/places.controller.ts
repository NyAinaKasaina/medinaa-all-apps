import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { QueryPlacesDto } from './dto/query-places.dto';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly service: PlacesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des entités médicales (filtres: q, type, status)' })
  findAll(@Query() query: QueryPlacesDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales de la base' })
  stats() {
    return this.service.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une entité par son UUID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
