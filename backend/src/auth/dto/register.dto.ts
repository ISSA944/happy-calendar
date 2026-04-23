import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  consents?: boolean;
}
