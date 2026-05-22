import { IsEmail, IsString, MinLength } from 'class-validator';

export class ConfirmRegistrationDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}
