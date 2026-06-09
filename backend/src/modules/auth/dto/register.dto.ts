import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class RegisterDto {
  @IsEmail() email: string
  @IsString() @MinLength(8) password: string
  @IsUUID() @IsOptional() entityId?: string
}
