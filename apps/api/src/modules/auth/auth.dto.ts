import { PartialType } from '@nestjs/mapped-types';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class CreateUserDto {
  @IsString()
  username!: string;

  @IsString()
  displayName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @ValidateIf((body: CreateUserDto) => body.role === UserRole.BIDAN_PUSKESMAS)
  @IsString()
  puskesmasId?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
