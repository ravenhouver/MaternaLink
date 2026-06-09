import { PartialType } from '@nestjs/mapped-types';
import { PregnancyRiskLevel } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  fullName!: string;

  @IsString()
  nik!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  bpjsNumber?: string;

  @IsOptional()
  @IsString()
  emergencyName?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  allergy?: string;

  @IsOptional()
  @IsString()
  chronicHistory?: string;

  @IsOptional()
  @IsDateString()
  lmp?: string;

  @IsOptional()
  @IsDateString()
  edd?: string;

  @IsOptional()
  @IsInt()
  gestationalAge?: number;

  @IsOptional()
  @IsString()
  ancVisit?: string;

  @IsOptional()
  @IsInt()
  gravida?: number;

  @IsOptional()
  @IsInt()
  para?: number;

  @IsOptional()
  @IsInt()
  abortus?: number;

  @IsOptional()
  @IsString()
  pregnancyType?: string;

  @IsOptional()
  @IsEnum(PregnancyRiskLevel)
  riskLevel?: PregnancyRiskLevel;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
