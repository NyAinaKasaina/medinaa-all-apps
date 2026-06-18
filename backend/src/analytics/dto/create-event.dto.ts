import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsIn(['pageview', 'cta_click'])
  name: 'pageview' | 'cta_click';

  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() path?: string;
  @IsOptional() @IsString() device?: string;
  @IsOptional() @IsString() referrer?: string;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
}
