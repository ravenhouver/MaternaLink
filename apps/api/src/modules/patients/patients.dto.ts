import { PregnancyRiskLevel } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  fullName!: string;

  @IsString()
  nik!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  gestationalAge?: number;

  @IsOptional()
  @IsString()
  ancVisit?: string;

  @IsOptional()
  @IsEnum(PregnancyRiskLevel)
  riskLevel?: PregnancyRiskLevel;
}
