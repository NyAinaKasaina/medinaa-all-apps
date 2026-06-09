import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdatePlaceDto {
  @IsString()  @IsOptional() name?: string
  @IsString()  @IsOptional() phone?: string
  @IsString()  @IsOptional() website?: string
  @IsString()  @IsOptional() openingHours?: string
  @IsString()  @IsOptional() addrStreet?: string
  @IsString()  @IsOptional() addrCity?: string
  @IsBoolean() @IsOptional() emergency?: boolean
  @IsNumber()  @IsOptional() beds?: number
}
