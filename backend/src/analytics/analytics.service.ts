import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './analytics-event.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly repo: Repository<AnalyticsEvent>,
  ) {}

  record(dto: CreateEventDto): Promise<AnalyticsEvent> {
    return this.repo.save(this.repo.create(dto));
  }
}
