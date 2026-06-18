import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent } from './analytics-event.entity';

describe('AnalyticsService', () => {
  it('persiste un event', async () => {
    const save = jest.fn().mockResolvedValue({ id: 'x' });
    const repo = { create: (d: any) => d, save };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: repo },
      ],
    }).compile();
    const service = moduleRef.get(AnalyticsService);
    await service.record({ name: 'pageview', locale: 'fr' });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'pageview' }));
  });
});
