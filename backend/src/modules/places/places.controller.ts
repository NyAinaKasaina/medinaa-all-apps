import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlacesService } from './places.service';
import { QueryPlacesDto } from './dto/query-places.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

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

  @Get('geojson')
  @ApiOperation({ summary: 'Entités en GeoJSON pour la carte (filtre ?category=)' })
  geojson(@Query('category') category?: string) {
    return this.service.geojson(category);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/claim')
  @ApiOperation({ summary: 'Revendiquer la propriété d\'une entité médicale' })
  claim(@Param('id') id: string, @Request() req: any) {
    return this.service.claimPlace(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une entité (propriétaire uniquement)' })
  update(@Param('id') id: string, @Body() dto: UpdatePlaceDto, @Request() req: any) {
    return this.service.updateByOwner(id, req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une entité par son UUID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
