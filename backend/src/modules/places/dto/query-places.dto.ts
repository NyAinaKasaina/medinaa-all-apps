import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPlacesDto {
  @ApiPropertyOptional({ description: 'Recherche sur le nom' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Catégorie (slug) : urgences_secours, soins_proximite…' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Type (slug) : pharmacie_officine, hopital_chu… (repli OSM legacy accepté)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Statut de classification : osm_auto, verified, unverified' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Géolocalisation : located (a une région) | missing (sans région)' })
  @IsOptional()
  @IsString()
  geo?: string;

  @ApiPropertyOptional({ description: 'Code faritra (région), ex. 11' })
  @IsOptional()
  @IsString()
  faritra?: string;

  @ApiPropertyOptional({ description: 'Code distrika (district), ex. 1101' })
  @IsOptional()
  @IsString()
  distrika?: string;

  @ApiPropertyOptional({ description: 'Code kaominina (commune), ex. 110101' })
  @IsOptional()
  @IsString()
  kaominina?: string;

  @ApiPropertyOptional({ description: 'Ville (addr_city, legacy)' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
