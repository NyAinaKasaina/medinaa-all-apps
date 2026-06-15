import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'

const emptyToNull = () => Transform(({ value }) => (value === '' ? null : value))

export class UpdatePlaceDto {
  @IsString()  @IsOptional() @emptyToNull() name?: string | null
  @IsString()  @IsOptional() @emptyToNull() phone?: string | null
  @IsString()  @IsOptional() @emptyToNull() website?: string | null
  @IsString()  @IsOptional() @emptyToNull() openingHours?: string | null
  @IsString()  @IsOptional() @emptyToNull() addrStreet?: string | null
  @IsString()  @IsOptional() @emptyToNull() addrCity?: string | null
  @IsBoolean() @IsOptional() emergency?: boolean
  @IsNumber()  @IsOptional() beds?: number
  // Curation : le propriétaire précise le type exact (validé côté service contre medical_types).
  @IsString()  @IsOptional() @emptyToNull() typeSlug?: string | null
}
