import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaxonomyService } from './taxonomy.service';

@ApiTags('taxonomy')
@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get()
  @ApiOperation({ summary: 'Arbre des catégories et types médicaux' })
  tree() {
    return this.taxonomy.tree();
  }

  @Get('types')
  @ApiOperation({ summary: 'Liste plate des types médicaux' })
  types() {
    return this.taxonomy.allTypes();
  }
}
