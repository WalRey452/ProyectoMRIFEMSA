import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;

  @IsOptional()
  lastPasswordChange?: Date;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  lockedUntil?: Date | null;

  @IsOptional()
  failedLoginAttempts?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
