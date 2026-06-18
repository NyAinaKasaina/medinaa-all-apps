import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Post('events')
  @HttpCode(204)
  @ApiOperation({ summary: 'Enregistre un événement analytics (beacon landing)' })
  async create(@Body() dto: CreateEventDto): Promise<void> {
    await this.service.record(dto);
  }
}
