import { PartialType } from '@nestjs/mapped-types';
import { ExaminationSource } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class ExaminationDiagnosisDto {
  @IsString()
  kondisiId!: string;

  @IsInt()
  jumlahKasus!: number;
}

export class ExaminationSymptomDto {
  @IsString()
  gejalaId!: string;

  @IsInt()
  jumlah!: number;
}

export class ExaminationMedicationDto {
  @IsString()
  obatId!: string;

  @IsInt()
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;

  @IsOptional()
  @IsNumber()
  frequency?: number;

  @IsOptional()
  @IsString()
  frequencyUnit?: string;
}

export class CreateExaminationDto {
  @IsOptional()
  @IsString()
  queueId?: string;

  @IsString()
  patientId!: string;

  @IsString()
  pregnancyId!: string;

  @IsOptional()
  @IsEnum(ExaminationSource)
  source?: ExaminationSource;

  @IsOptional()
  @IsString()
  complaint?: string;

  @IsOptional()
  @IsObject()
  vitalSigns?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  gestationalAge?: number;

  @IsOptional()
  @IsString()
  ancVisit?: string;

  @IsOptional()
  @IsArray()
  diagnosis?: ExaminationDiagnosisDto[];

  @IsOptional()
  @IsArray()
  symptoms?: ExaminationSymptomDto[];

  @IsOptional()
  @IsArray()
  medication?: ExaminationMedicationDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  riskSummary?: Record<string, unknown>;
}

export class UpdateExaminationDto extends PartialType(CreateExaminationDto) {}

export class AiExaminationDraftDto {
  @IsString()
  complaint!: string;

  @IsOptional()
  @IsString()
  period?: string;
}
