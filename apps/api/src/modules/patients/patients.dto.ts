import { PartialType } from '@nestjs/mapped-types';
import { PregnancyRiskLevel } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  emergencyName!: string;

  @IsString()
  @IsNotEmpty()
  emergencyPhone!: string;

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
  @IsString()
  visitReason?: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsArray()
  emergencySigns?: string[];

  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  riskFactors?: string[];

  @IsOptional()
  @IsArray()
  routineMedication?: string[];

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsString()
  responsibleDoctor?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsEnum(PregnancyRiskLevel)
  riskLevel?: PregnancyRiskLevel;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
