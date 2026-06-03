import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get('json')
  @ApiOperation({ summary: 'Exporte toutes les entités en JSON' })
  toJson() {
    return this.service.toJson();
  }

  @Get('csv')
  @ApiOperation({ summary: 'Exporte toutes les entités en CSV (téléchargement)' })
  @ApiProduces('text/csv')
  async toCsv(@Res() res: Response) {
    const csv = await this.service.toCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="medical_entities_madagascar.csv"',
    );
    res.send(csv);
  }
}
