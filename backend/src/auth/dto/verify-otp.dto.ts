import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(4, 4, { message: 'code must be exactly 4 digits' })
  code!: string;
}
